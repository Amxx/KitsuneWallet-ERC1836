const chai = require('chai');
const ethers = require('ethers');
const { SDK } = require('@kitsune-wallet/sdk/dist/sdk');
const {createMockProvider, deployContract, getWallets, solidity} = require('ethereum-waffle');

const withENS             = require('../utils/withENS.js');
const KitsuneProxyFactory = require('../../build/KitsuneProxyFactory');
const Target              = require('../../build/Target');

const {expect} = chai;
chai.use(solidity);
ethers.errors.setLogLevel('error');

eth = x => ethers.utils.parseEther(x.toString())
describe('KitsuneProxyFactory', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const sdk = new SDK(provider, relayer);

	before(async () => {
		targetContract = await deployContract(wallet, Target, []);
		dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));
	});

	beforeEach(async () => {
		proxyFactory = await deployContract(wallet, KitsuneProxyFactory, []);
	});

	describe('createProxy', async () => {

		it('Predictable Address', async () => {
			const name     = "WalletOwnable";
			const data     = "0x";
			const seed     = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			const master = await sdk.contracts.getActiveInstance(name, { deploy: { enable: true } });

			const hash = ethers.utils.keccak256(ethers.utils.solidityPack([
				"bytes",
				"bytes"
			], [
				await proxyFactory.PROXY_CODE(),
				ethers.utils.defaultAbiCoder.encode([ "address", "bytes" ], [ master.address, data ])
			]));
			const salt = ethers.utils.keccak256(ethers.utils.solidityPack([
				"bytes32",
				"bytes",
			], [
				seed,
				data
			]));
			const predictedAddress = ethers.utils.getAddress(ethers.utils.solidityKeccak256(
				[ 'bytes1', 'address',            'bytes32', 'bytes32' ],
				[ '0xff',   proxyFactory.address, salt,      hash      ]
			).slice(26));

			expect(await proxyFactory.predictAddress(master.address, data, seed)).to.be.eq(predictedAddress);

			await expect(
				proxyFactory.createProxy(master.address, data, seed)
			).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);
		});

		it('without initialization', async () => {
			const name = "WalletOwnable";
			const data = "0x";
			const seed = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			const master   = await sdk.contracts.getActiveInstance(name, { deploy: { enable: true } });

			const predictedAddress = await proxyFactory.predictAddress(master.address, data, seed);

			await expect(proxyFactory.createProxy(master.address, data, seed)).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);

			proxy = sdk.contracts.viewContract(name, predictedAddress);

			expect(await proxy.owner()).to.be.equal(ethers.constants.AddressZero);
			expect(await proxy.isController(ethers.constants.AddressZero)).to.be.equal(true);
			expect(await proxy.isController(user1.address)).to.be.equal(false);
			expect(await proxy.isController(user2.address)).to.be.equal(false);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.isInitialized()).to.be.equal(false);

			await expect(proxy.connect(user1).initialize(user1.address, { gasLimit: 500000 })).to.be.not.reverted;

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.isController(ethers.constants.AddressZero)).to.be.equal(false);
			expect(await proxy.isController(user1.address)).to.be.equal(true);
			expect(await proxy.isController(user2.address)).to.be.equal(false);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.isInitialized()).to.be.equal(true);

			await expect(proxy.connect(user2).initialize(user2.address)).to.revertedWith('already-initialized');

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.isController(ethers.constants.AddressZero)).to.be.equal(false);
			expect(await proxy.isController(user1.address)).to.be.equal(true);
			expect(await proxy.isController(user2.address)).to.be.equal(false);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.isInitialized()).to.be.equal(true);
		});

		it('with initialization', async () => {
			const name = "WalletOwnable";
			const data = sdk.transactions.initialization(name, [ user1.address ]);
			const seed = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			const master   = await sdk.contracts.getActiveInstance(name, { deploy: { enable: true } });

			const predictedAddress = await proxyFactory.predictAddress(master.address, data, seed);

			await expect(proxyFactory.createProxy(master.address, data, seed)).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);

			proxy = sdk.contracts.viewContract(name, predictedAddress);

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.isController(ethers.constants.AddressZero)).to.be.equal(false);
			expect(await proxy.isController(user1.address)).to.be.equal(true);
			expect(await proxy.isController(user2.address)).to.be.equal(false);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.isInitialized()).to.be.equal(true);

			await expect(proxy.connect(wallet).initialize(user2.address)).to.revertedWith('already-initialized');

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.isController(ethers.constants.AddressZero)).to.be.equal(false);
			expect(await proxy.isController(user1.address)).to.be.equal(true);
			expect(await proxy.isController(user2.address)).to.be.equal(false);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.isInitialized()).to.be.equal(true);
		});

		it('callback initialization', async () => {
			const name = "WalletOwnable";
			const data = "0x";
			const seed = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			const master   = await sdk.contracts.getActiveInstance(name, { deploy: { enable: true } });

			const predictedAddress = await proxyFactory.predictAddress(master.address, data, seed);

			const callback = sdk.transactions.initialization(name, [ user1.address ]);

			await expect(proxyFactory.createProxyAndCallback(
				master.address,
				data,
				callback,
				seed,
				{ gasLimit: 500000 }
			)).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);

			proxy = sdk.contracts.viewContract(name, predictedAddress);

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.isController(ethers.constants.AddressZero)).to.be.equal(false);
			expect(await proxy.isController(user1.address)).to.be.equal(true);
			expect(await proxy.isController(user2.address)).to.be.equal(false);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.isInitialized()).to.be.equal(true);

			await expect(proxy.connect(wallet).initialize(user2.address)).to.revertedWith('already-initialized');

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.isController(ethers.constants.AddressZero)).to.be.equal(false);
			expect(await proxy.isController(user1.address)).to.be.equal(true);
			expect(await proxy.isController(user2.address)).to.be.equal(false);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.isInitialized()).to.be.equal(true);
		});

		it('No duplicated', async () => {
			const name = "WalletOwnable";
			const data = "0x";
			const seed = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			const master   = await sdk.contracts.getActiveInstance(name, { deploy: { enable: true } });

			const predictedAddress = await proxyFactory.predictAddress(master.address, data, seed);

			const callback1 = sdk.transactions.initialization(name, [ user1.address ]);
			const callback2 = sdk.transactions.initialization(name, [ user2.address ]);

			await expect(proxyFactory.createProxyAndCallback(
				master.address,
				data,
				callback1,
				seed,
				{ gasLimit: 500000 }
			)).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);

			await expect(proxyFactory.createProxyAndCallback(
				master.address,
				data,
				callback2,
				seed,
				{ gasLimit: 500000 }
			)).to.be.reverted;

			proxy = sdk.contracts.viewContract(name, predictedAddress);

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.isController(ethers.constants.AddressZero)).to.be.equal(false);
			expect(await proxy.isController(user1.address)).to.be.equal(true);
			expect(await proxy.isController(user2.address)).to.be.equal(false);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.isInitialized()).to.be.equal(true);

			await expect(proxy.connect(wallet).initialize(user2.address)).to.revertedWith('already-initialized');

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.isController(ethers.constants.AddressZero)).to.be.equal(false);
			expect(await proxy.isController(user1.address)).to.be.equal(true);
			expect(await proxy.isController(user2.address)).to.be.equal(false);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.isInitialized()).to.be.equal(true);
		});

	});

});
