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
describe('WalletOwnable', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const sdk = new SDK(provider, relayer);

	before(async () => {
		targetContract = await deployContract(wallet, Target, []);
		dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));
	});
	beforeEach(async () => {
		proxyFactory   = await deployContract(wallet, KitsuneProxyFactory, []);
	});

	describe('createProxy', async () => {

		it('OwnableProxy - no callback', async () => {
			const name = "WalletOwnable";
			const seed = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			const master   = await sdk.contracts.getActiveInstance(name, { deploy: { enable: true } });
			const codeHash = ethers.utils.keccak256(ethers.utils.solidityPack([
				"bytes",
				"bytes"
			], [
				await proxyFactory.PROXY_CODE(),
				ethers.utils.defaultAbiCoder.encode([ "address", "bytes" ], [ master.address, "0x" ])
			]));
			const salt = ethers.utils.keccak256(seed);

			const predictedAddress = ethers.utils.getAddress(ethers.utils.solidityKeccak256(
				[ 'bytes1', 'address',            'bytes32', 'bytes32' ],
				[ '0xff',   proxyFactory.address, salt,      codeHash  ]
			).slice(26));

			const callback = "0x";

			await expect(
				proxyFactory.createProxy(master.address, callback, salt)
			).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);

			proxy = sdk.contracts.viewContract(name, predictedAddress);

			expect(await proxy.owner()).to.be.equal(ethers.constants.AddressZero);
			expect(await proxy.controller()).to.be.equal(ethers.constants.AddressZero);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(false);

			// await expect(proxy.connect(user1).initialize(user1.address));
			//
			// expect(await proxy.owner()).to.be.equal(user1.address);
			// expect(await proxy.controller()).to.be.equal(user1.address);
			// expect(await proxy.implementation()).to.be.equal(master.address);
			// expect(await proxy.proxyType()).to.be.equal(2);
			// expect(await proxy.initialized()).to.be.equal(true);
			//
			// await expect(proxy.connect(user2).initialize(user2.address)).to.revertedWith('already-initialized');
			//
			// expect(await proxy.owner()).to.be.equal(user1.address);
			// expect(await proxy.controller()).to.be.equal(user1.address);
			// expect(await proxy.implementation()).to.be.equal(master.address);
			// expect(await proxy.proxyType()).to.be.equal(2);
			// expect(await proxy.initialized()).to.be.equal(true);
		});

		it('OwnableProxy - callback', async () => {
			const name = "WalletOwnable";
			const seed = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			const master   = await sdk.contracts.getActiveInstance(name, { deploy: { enable: true } });
			const codeHash = ethers.utils.keccak256(ethers.utils.solidityPack([
				"bytes",
				"bytes"
			], [
				await proxyFactory.PROXY_CODE(),
				ethers.utils.defaultAbiCoder.encode([ "address", "bytes" ], [ master.address, "0x" ])
			]));
			const salt = ethers.utils.keccak256(seed);

			const predictedAddress = ethers.utils.getAddress(ethers.utils.solidityKeccak256(
				[ 'bytes1', 'address',            'bytes32', 'bytes32' ],
				[ '0xff',   proxyFactory.address, salt,      codeHash  ]
			).slice(26));

			const callback = sdk.transactions.initialization(name, [ user1.address ]);

			await expect(
				proxyFactory.createProxy(master.address, callback, salt)
			).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);

			proxy = sdk.contracts.viewContract(name, predictedAddress);

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.controller()).to.be.equal(user1.address);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);

			await expect(proxy.connect(wallet).initialize(user2.address)).to.revertedWith('already-initialized');

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.controller()).to.be.equal(user1.address);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);
		});

		it('OwnableProxy - user based salt', async () => {
			const name = "WalletOwnable";
			const seed = user1.address;

			const master   = await sdk.contracts.getActiveInstance(name, { deploy: { enable: true } });
			const codeHash = ethers.utils.keccak256(ethers.utils.solidityPack([
				"bytes",
				"bytes"
			], [
				await proxyFactory.PROXY_CODE(),
				ethers.utils.defaultAbiCoder.encode([ "address", "bytes" ], [ master.address, "0x" ])
			]));
			const salt = ethers.utils.keccak256(seed);

			const predictedAddress = ethers.utils.getAddress(ethers.utils.solidityKeccak256(
				[ 'bytes1', 'address',            'bytes32', 'bytes32' ],
				[ '0xff',   proxyFactory.address, salt,      codeHash  ]
			).slice(26));

			const callback = sdk.transactions.initialization(name, [ user1.address ]);

			await expect(
				proxyFactory.createProxy(master.address, callback, salt)
			).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);

			proxy = sdk.contracts.viewContract(name, predictedAddress);

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.controller()).to.be.equal(user1.address);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);

			await expect(proxy.connect(wallet).initialize(user2.address)).to.revertedWith('already-initialized');

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.controller()).to.be.equal(user1.address);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);
		});

		it('No duplicated', async () => {
			const name = "WalletOwnable";
			const seed = user1.address;

			const master   = await sdk.contracts.getActiveInstance(name, { deploy: { enable: true } });
			const codeHash = ethers.utils.keccak256(ethers.utils.solidityPack([
				"bytes",
				"bytes"
			], [
				await proxyFactory.PROXY_CODE(),
				ethers.utils.defaultAbiCoder.encode([ "address", "bytes" ], [ master.address, "0x" ])
			]));
			const salt = ethers.utils.keccak256(seed);

			const predictedAddress = ethers.utils.getAddress(ethers.utils.solidityKeccak256(
				[ 'bytes1', 'address',            'bytes32', 'bytes32' ],
				[ '0xff',   proxyFactory.address, salt,      codeHash  ]
			).slice(26));

			const callback = sdk.transactions.initialization(name, [ user1.address ]);

			await expect(
				proxyFactory.createProxy(master.address, callback, salt)
			).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);

			await expect(
				proxyFactory.createProxy(master.address, callback, salt)
			).to.be.reverted;

			proxy = sdk.contracts.viewContract(name, predictedAddress);

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.controller()).to.be.equal(user1.address);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);

			await expect(proxy.connect(wallet).initialize(user2.address)).to.revertedWith('already-initialized');

			expect(await proxy.owner()).to.be.equal(user1.address);
			expect(await proxy.controller()).to.be.equal(user1.address);
			expect(await proxy.implementation()).to.be.equal(master.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);
		});

	});

});
