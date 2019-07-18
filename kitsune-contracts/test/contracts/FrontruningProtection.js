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
		protection     = await sdk.contracts.getActiveInstance("FrontrunningProtection", { deploy: { enable: true } });
		targetContract = await deployContract(wallet, Target, []);
	});

	beforeEach(async () => {
		proxyFactory = await deployContract(wallet, KitsuneProxyFactory, []);
	});

	describe('createProxy', async () => {

		it('FrontrunningProtection - 2 step - unprotected - danger', async () => {
			const main_name     = "WalletOwnable";
			const main_contract = await sdk.contracts.getActiveInstance(main_name, { deploy: { enable: true } });
			const main_data     = sdk.transactions.initialization(main_name, [ user1.address ]);

			const prefixLength = 0x0;
			const prefix       = [
				...ethers.utils.padZeros(main_contract.address, 32),
				...ethers.utils.arrayify(main_data),
			].slice(0, prefixLength);
			const prefixHash   = ethers.utils.keccak256(prefix);

			const init_name     = "FrontrunningProtection";
			const init_contract = await sdk.contracts.getActiveInstance(init_name, { deploy: { enable: true } });
			const init_data     = sdk.transactions.initialization(init_name, [ prefixLength, prefixHash ]);

			const seed = ethers.utils.hexlify(ethers.utils.randomBytes(32));
			const predictedAddress = await proxyFactory.predictAddress(init_contract.address, init_data, seed);
			await expect(proxyFactory.createProxy(
				init_contract.address,
				init_data,
				seed,
				{ gasLimit: 500000 }
			)).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);

			proxy = sdk.contracts.viewContract(init_name, predictedAddress);

			expect(await proxy.controller()).to.be.equal(proxy.address);
			expect(await proxy.implementation()).to.be.equal(init_contract.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);

			await expect(proxy.connect(user2).secureSetup(
				main_contract.address,
				sdk.transactions.initialization(main_name, [ user2.address ]),
				{ gasLimit: 500000 }
			)).to.be.not.reverted;

			proxy = sdk.contracts.viewContract(main_name, predictedAddress);

			expect(await proxy.controller()).to.be.equal(user2.address);
			expect(await proxy.implementation()).to.be.equal(main_contract.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);
		});

		it('FrontrunningProtection - 2 step - protected - success', async () => {
			const main_name     = "WalletOwnable";
			const main_contract = await sdk.contracts.getActiveInstance(main_name, { deploy: { enable: true } });
			const main_data     = sdk.transactions.initialization(main_name, [ user1.address ]);

			const prefixLength = 0x44;
			const prefix       = [
				...ethers.utils.padZeros(main_contract.address, 32),
				...ethers.utils.arrayify(main_data),
			].slice(0, prefixLength);
			const prefixHash   = ethers.utils.keccak256(prefix);

			const init_name     = "FrontrunningProtection";
			const init_contract = await sdk.contracts.getActiveInstance(init_name, { deploy: { enable: true } });
			const init_data     = sdk.transactions.initialization(init_name, [ prefixLength, prefixHash ]);

			const seed = ethers.utils.hexlify(ethers.utils.randomBytes(32));
			const predictedAddress = await proxyFactory.predictAddress(init_contract.address, init_data, seed);
			await expect(proxyFactory.createProxy(
				init_contract.address,
				init_data,
				seed,
				{ gasLimit: 500000 }
			)).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);

			proxy = sdk.contracts.viewContract(init_name, predictedAddress);

			expect(await proxy.controller()).to.be.equal(proxy.address);
			expect(await proxy.implementation()).to.be.equal(init_contract.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);

			await expect(proxy.connect(user1).secureSetup(
				main_contract.address,
				main_data,
				{ gasLimit: 500000 }
			)).to.be.not.reverted;

			proxy = sdk.contracts.viewContract(main_name, predictedAddress);

			expect(await proxy.controller()).to.be.equal(user1.address);
			expect(await proxy.implementation()).to.be.equal(main_contract.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);
		});

		it('FrontrunningProtection - 2 step - protected - catch', async () => {
			const main_name     = "WalletOwnable";
			const main_contract = await sdk.contracts.getActiveInstance(main_name, { deploy: { enable: true } });
			const main_data     = sdk.transactions.initialization(main_name, [ user1.address ]);

			const prefixLength = 0x44;
			const prefix       = [
				...ethers.utils.padZeros(main_contract.address, 32),
				...ethers.utils.arrayify(main_data),
			].slice(0, prefixLength);
			const prefixHash   = ethers.utils.keccak256(prefix);

			const init_name     = "FrontrunningProtection";
			const init_contract = await sdk.contracts.getActiveInstance(init_name, { deploy: { enable: true } });
			const init_data     = sdk.transactions.initialization(init_name, [ prefixLength, prefixHash ]);

			const seed = ethers.utils.hexlify(ethers.utils.randomBytes(32));
			const predictedAddress = await proxyFactory.predictAddress(init_contract.address, init_data, seed);
			await expect(proxyFactory.createProxy(
				init_contract.address,
				init_data,
				seed,
				{ gasLimit: 500000 }
			)).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);

			proxy = sdk.contracts.viewContract(init_name, predictedAddress);

			expect(await proxy.controller()).to.be.equal(proxy.address);
			expect(await proxy.implementation()).to.be.equal(init_contract.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);

			await expect(proxy.connect(user2).secureSetup(
				main_contract.address,
				sdk.transactions.initialization(main_name, [ user2.address ]),
				{ gasLimit: 500000 }
			)).to.be.reverted;

			expect(await proxy.controller()).to.be.equal(proxy.address);
			expect(await proxy.implementation()).to.be.equal(init_contract.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);
		});

		it('FrontrunningProtection - 1 step - protected - success', async () => {
			const main_name     = "WalletOwnable";
			const main_contract = await sdk.contracts.getActiveInstance(main_name, { deploy: { enable: true } });
			const main_data     = sdk.transactions.initialization(main_name, [ user1.address ]);

			const prefixLength = 0x44;
			const prefix       = [
				...ethers.utils.padZeros(main_contract.address, 32),
				...ethers.utils.arrayify(main_data),
			].slice(0, prefixLength);
			const prefixHash   = ethers.utils.keccak256(prefix);

			const init_name     = "FrontrunningProtection";
			const init_contract = await sdk.contracts.getActiveInstance(init_name, { deploy: { enable: true } });
			const init_data     = sdk.transactions.initialization(init_name, [ prefixLength, prefixHash ]);

			const callback = new ethers.utils.Interface(sdk.ABIS[init_name].abi).functions.secureSetup.encode([ main_contract.address, main_data ]);

			const seed = ethers.utils.hexlify(ethers.utils.randomBytes(32));
			const predictedAddress = await proxyFactory.predictAddress(init_contract.address, init_data, seed);
			await expect(proxyFactory.createProxyAndCallback(
				init_contract.address,
				init_data,
				callback,
				seed,
				{ gasLimit: 500000 }
			)).to.emit(proxyFactory, 'NewProxy').withArgs(predictedAddress);

			proxy = sdk.contracts.viewContract(main_name, predictedAddress);

			expect(await proxy.controller()).to.be.equal(user1.address);
			expect(await proxy.implementation()).to.be.equal(main_contract.address);
			expect(await proxy.proxyType()).to.be.equal(2);
			expect(await proxy.initialized()).to.be.equal(true);
		});

		it('FrontrunningProtection - 1 step - protected - catch', async () => {
			const main_name     = "WalletOwnable";
			const main_contract = await sdk.contracts.getActiveInstance(main_name, { deploy: { enable: true } });
			const main_data     = sdk.transactions.initialization(main_name, [ user1.address ]);

			const prefixLength = 0x44;
			const prefix       = [
				...ethers.utils.padZeros(main_contract.address, 32),
				...ethers.utils.arrayify(main_data),
			].slice(0, prefixLength);
			const prefixHash   = ethers.utils.keccak256(prefix);

			const init_name     = "FrontrunningProtection";
			const init_contract = await sdk.contracts.getActiveInstance(init_name, { deploy: { enable: true } });
			const init_data     = sdk.transactions.initialization(init_name, [ prefixLength, prefixHash ]);

			const main_data_frontrunning = sdk.transactions.initialization(main_name, [ user2.address ]);
			const callback_frontrunning  = new ethers.utils.Interface(sdk.ABIS[init_name].abi).functions.secureSetup.encode([ main_contract.address, main_data_frontrunning ]);

			const seed = ethers.utils.hexlify(ethers.utils.randomBytes(32));
			const predictedAddress = await proxyFactory.predictAddress(init_contract.address, init_data, seed);
			await expect(proxyFactory.createProxyAndCallback(
				init_contract.address,
				init_data,
				callback_frontrunning,
				seed,
				{ gasLimit: 500000 }
			)).to.be.reverted;
		});

	});

});
