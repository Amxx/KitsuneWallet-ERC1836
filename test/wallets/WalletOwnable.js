const chai   = require('chai');
const ethers = require('ethers');
const {createMockProvider, deployContract, getWallets, solidity} = require('ethereum-waffle');

const { Sdk } = require('../../sdk/sdk.js');
const Target   = require('../../build/Target');

const {expect} = chai;
chai.use(solidity);
ethers.errors.setLogLevel('error');

eth = x => ethers.utils.parseEther(x.toString())
describe('WalletOwnable', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const sdk = new Sdk(provider, relayer);

	before(async () => {
		walletContract = await sdk.contracts.getMasterInstance("WalletOwnable");
		targetContract = await deployContract(wallet, Target, []);
		dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));
	});

	beforeEach(async () => {
		proxy = await sdk.contracts.deployProxy("WalletOwnable", [ user1.address ]);

		await wallet.sendTransaction({to: proxy.address, value: eth(1.0)});
	});

	it ("Verify proxy initialization", async () => {
		expect(await proxy.owner()).to.eq(user1.address);
		expect(await proxy.master()).to.eq(walletContract.address);
	});

	describe('Execute', async () => {

		it ("authorized - pay with proxy", async () => {
			expect(await provider.getBalance(proxy.address)).to.eq(eth(1.0));
			expect(await provider.getBalance(dest         )).to.eq(eth(0.0));

			await expect(proxy.connect(user1).execute(
				0,
				dest,
				eth(0.1),
				[],
				{ gasLimit: 80000 }
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);

			expect(await provider.getBalance(proxy.address)).to.eq(eth(0.9));
			expect(await provider.getBalance(dest         )).to.eq(eth(0.1));
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

			expect(await targetContract.lastSender()).to.eq(proxy.address);
			expect(await targetContract.lastData()).to.eq(randomdata);
		});

		it("protected", async () => {
			expect(await provider.getBalance(proxy.address)).to.eq(eth(1.0));

			await expect(proxy.connect(user2).execute(
				0,
				user2.address,
				eth(0.1),
				[],
				{ gasLimit: 80000 }
			)).to.be.revertedWith('access-forbidden');

			expect(await provider.getBalance(proxy.address)).to.eq(eth(1.0));
		});
	});

	describe('TransferOwnership', async () => {

		it("authorized", async () => {
			await expect(proxy.connect(user1).transferOwnership(
				user2.address,
				{ gasLimit: 80000 }
			)).to.emit(proxy, 'OwnershipTransferred').withArgs(user1.address, user2.address);

			expect(await proxy.owner()).to.eq(user2.address);
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
			await expect(proxy.connect(user1).execute(
				0,
				proxy.address,
				0,
				await sdk.transactions.prepare.updateMaster(
					"WalletOwnable",
					sdk.transactions.prepare.initialization("WalletOwnable", [ user2.address ]),
				),
				{ gasLimit: 800000 }
			)).to
			.emit(proxy, 'CallSuccess').withArgs(proxy.address)
			.emit(proxy, 'MasterChange').withArgs(walletContract.address, walletContract.address);

			expect(await proxy.owner()).to.eq(user2.address);
		});

		it ("protected", async () => {
			await expect(proxy.connect(user2).execute(
				0,
				proxy.address,
				0,
				await sdk.transactions.prepare.updateMaster(
					"WalletOwnable",
					sdk.transactions.prepare.initialization("WalletOwnable", [ user2.address ]),
				),
				{ gasLimit: 800000 }
			)).to.be.revertedWith('access-forbidden');
		});

	});

	describe('Initialize', async () => {

		it ("reintrance protection", async () => {
			await expect(proxy.connect(user1).initialize(user2.address)).to.be.revertedWith('already-initialized');
		});

	});



});
