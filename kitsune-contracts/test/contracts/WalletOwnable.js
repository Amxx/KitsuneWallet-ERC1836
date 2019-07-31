const chai = require('chai');
const ethers = require('ethers');
const { SDK } = require('@kitsune-wallet/sdk/dist/sdk');
const {createMockProvider, deployContract, getWallets, solidity} = require('ethereum-waffle');

const withENS = require('../utils/withENS.js');
const Target = require('../../build/Target');

const {expect} = chai;
chai.use(solidity);
ethers.errors.setLogLevel('error');

eth = x => ethers.utils.parseEther(x.toString())
describe('WalletOwnable', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const sdk = new SDK(provider, relayer);

	before(async () => {
		walletContract = await sdk.contracts.getActiveInstance("WalletOwnable", { deploy: { enable: true } });
		targetContract = await deployContract(wallet, Target, []);
		dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));
	});

	beforeEach(async () => {
		proxy = await sdk.contracts.deployProxy("WalletOwnable", [ user1.address ]);

		await wallet.sendTransaction({to: proxy.address, value: eth(1.0)});
	});

	describe('Initialize', async () => {
		it('Verify proxy initialization', async () => {
			expect(await proxy.owner()).to.be.eq(user1.address);
			expect(await proxy.implementation()).to.be.eq(walletContract.address);
		});

		it('reintrance protection', async () => {
			await expect(proxy.connect(user1).initialize(user2.address)).to.be.revertedWith('already-initialized');
		});

		it('Invalid initialization protection', async () => {
			await expect(sdk.contracts.deployProxy(
				"WalletOwnable",
				[ ethers.constants.AddressZero ]
			)).to.be.revertedWith("failed-to-initialize");
		});
	});

	describe('ENS', async () => {
		let ensAddress       = undefined;
		let resolverAddress  = undefined;
		let registrarAddress = undefined;
		let providerWithENS  = undefined;

		it('ENS deployment', async () => {
			({ ensAddress, resolverAddress, registrarAddress, providerWithENS } = await withENS(wallet));
			expect(ensAddress).to.not.eq(undefined);
			expect(resolverAddress).to.not.eq(undefined);
			expect(registrarAddress).to.not.eq(undefined);
		});

		it('ENS registration', async () => {
			const domain    = 'kitsune.eth';
			const label     = 'proxy';
			const hashLabel = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label));
			const name      = `${label}.${domain}`;
			const node      = ethers.utils.namehash(name);

			expect(await providerWithENS.resolveName(name)).to.be.eq(null);
			// expect(await providerWithENS.lookupAddress(proxy.address)).to.be.eq(null); // TODO FIX

			await expect(proxy.connect(user1).registerENS(
				hashLabel,        /* bytes32        */
				name,             /* string         */
				node,             /* bytes32        */
				ensAddress,       /* ENSRegistry    */
				registrarAddress, /* FIFSRegistrar  */
				resolverAddress,  /* PublicResolver */
				{ gasLimit: 230000 }
			)).to.not.reverted;

			expect(await providerWithENS.resolveName(name)).to.be.eq(proxy.address);
			expect(await providerWithENS.lookupAddress(proxy.address)).to.be.eq(name);
		});
	})

	describe('Execute', async () => {

		it ("authorized - pay with proxy", async () => {
			expect(await provider.getBalance(proxy.address)).to.be.eq(eth(1.0));
			expect(await provider.getBalance(dest         )).to.be.eq(eth(0.0));

			await expect(proxy.connect(user1).execute(
				0,
				dest,
				eth(0.1),
				[],
				{ gasLimit: 80000 }
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);

			expect(await provider.getBalance(proxy.address)).to.be.eq(eth(0.9));
			expect(await provider.getBalance(dest         )).to.be.eq(eth(0.1));
		});

		it ("authorized - call with proxy", async () => {
			randomdata = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			await expect(proxy.connect(user1).execute(
				0,
				targetContract.address,
				0,
				targetContract.interface.functions.call.encode([ randomdata ]),
				{ gasLimit: 80000 }
			)).to.emit(proxy, 'CallSuccess').withArgs(targetContract.address);

			expect(await targetContract._lastSender()).to.be.eq(proxy.address);
			expect(await targetContract._lastData()).to.be.eq(randomdata);
		});

		it("protected", async () => {
			expect(await provider.getBalance(proxy.address)).to.be.eq(eth(1.0));

			await expect(proxy.connect(user2).execute(
				0,
				user2.address,
				eth(0.1),
				[],
				{ gasLimit: 80000 }
			)).to.be.reverted; // onlyOwner overridden by openzeppelin's ownable

			expect(await provider.getBalance(proxy.address)).to.be.eq(eth(1.0));
		});
	});

	describe('TransferOwnership', async () => {

		it("authorized", async () => {
			await expect(proxy.connect(user1).transferOwnership(
				user2.address,
				{ gasLimit: 80000 }
			)).to.emit(proxy, 'OwnershipTransferred').withArgs(user1.address, user2.address);

			expect(await proxy.owner()).to.be.eq(user2.address);
		});

		it("protected", async () => {
			await expect(proxy.connect(user2).transferOwnership(
				user2.address,
				{ gasLimit: 80000 }
			)).to.be.reverted;
		});

	});

	describe('UpdateMaster', async () => {

		it("authorized", async () => {
			await expect(proxy.connect(user1).updateImplementation(
				walletContract.address,
				sdk.transactions.initialization("WalletOwnable", [ user2.address ]),
				true,
				{ gasLimit: 800000 }
			)).to.emit(proxy, 'Upgraded').withArgs(walletContract.address);

			expect(await proxy.owner()).to.be.eq(user2.address);
		});

		it ("protected", async () => {
			await expect(proxy.connect(user2).updateImplementation(
				walletContract.address,
				sdk.transactions.initialization("WalletOwnable", [ user2.address ]),
				true,
				{ gasLimit: 800000 }
			)).to.be.revertedWith("access-denied");
		});
	});

});
