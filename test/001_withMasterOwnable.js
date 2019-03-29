const chai = require('chai');
const {createMockProvider, deployContract, getWallets, solidity} = require('ethereum-waffle');
const ethers = require('ethers');

const Proxy          = require('../build/Proxy');
const WalletOwnable  = require('../build/WalletOwnable');
const TargetContract = require('../build/TargetContract');

chai.use(solidity);
const {expect} = chai;

describe('WalletOwnable', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);

	// let provider = new ethers.providers.JsonRpcProvider();
	// let wallet   = new ethers.Wallet("0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407", provider);
	// let relayer  = new ethers.Wallet("0xde43b282c2931fc41ca9e1486fedc2c45227a3b9b4115c89d37f6333c8816d89", provider);
	// let user1    = new ethers.Wallet("0xfb9d8a917d85d7d9a052745248ecbf6a2268110945004dd797e82e8d4c071e79", provider);
	// let user2    = new ethers.Wallet("0x2a46e8c1535792f6689b10d5c882c9363910c30751ec193ae71ec71630077909", provider);

	before(async () => {
		walletContract = await deployContract(wallet, WalletOwnable, []);
		targetContract = await deployContract(wallet, TargetContract, []);
		dest = ethers.utils.hexlify(ethers.utils.randomBytes(20));
	});

	beforeEach(async () => {
		proxyContract = await deployContract(wallet, Proxy, [
			walletContract.address,
			walletContract.interface.functions.initialize.encode([ user1.address ])
		]);
		proxyAsWallet = new ethers.Contract(proxyContract.address, WalletOwnable.abi, provider);

		await wallet.sendTransaction({to: proxyAsWallet.address, value: 1000});
	});

	it ("Verify proxy initialization", async () => {
		expect(await proxyAsWallet.owner()).to.eq(user1.address);
		expect(await proxyAsWallet.master()).to.eq(walletContract.address);
	});

	describe('Execute', async () => {

		it ("authorized - pay with proxy", async () => {
			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(1000);
			expect(await provider.getBalance(dest                 )).to.eq(   0);

			tx = await proxyAsWallet.connect(user1).execute(
				0,
				dest,
				500,
				[],
				{ gasLimit: 80000 }
			);

			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(500);
			expect(await provider.getBalance(dest                 )).to.eq(500);
		});

		it ("authorized - call with proxy", async () => {
			randomdata = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			tx = await proxyAsWallet.connect(user1).execute(
				0,
				targetContract.address,
				0,
				targetContract.interface.functions.call.encode([ randomdata ]),
				{ gasLimit: 80000 }
			);

			expect(await targetContract.lastSender()).to.eq(proxyAsWallet.address);
			expect(await targetContract.lastData()).to.eq(randomdata);
		});

		it("protected", async () => {
			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(1000);

			expect(proxyAsWallet.connect(user2).execute(
				0,
				user2.address,
				500,
				[],
				{ gasLimit: 80000 }
			)).to.be.revertedWith('access-forbidden');

			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(1000);
		});
	});

	describe('TransferOwnership', async () => {

		it("authorized", async () => {
			await proxyAsWallet.connect(user1).transferOwnership(
				user2.address,
				{ gasLimit: 80000 }
			);
			expect(await proxyAsWallet.owner()).to.eq(user2.address);
		});

		it("TransferOwnership - protected", async () => {
			expect(proxyAsWallet.connect(user2).transferOwnership(
				user2.address,
				{ gasLimit: 80000 }
			)).to.be.reverted;
		});

	});

	describe('UpdateMaster', async () => {

		it("authorized", async () => {
			await proxyAsWallet.connect(user1).execute(
				0,
				proxyAsWallet.address,
				0,
				proxyAsWallet.interface.functions.updateMaster.encode([
					walletContract.address,
					walletContract.interface.functions.initialize.encode([ user2.address ]),
					true,
				]),
				{ gasLimit: 800000 }
			)

			expect(await proxyAsWallet.owner()).to.eq(user2.address);
		});

		it ("protected", async () => {
			expect(proxyAsWallet.connect(user2).execute(
				0,
				proxyAsWallet.address,
				0,
				proxyAsWallet.interface.functions.updateMaster.encode([
					walletContract.address,
					walletContract.interface.functions.initialize.encode([ user2.address ]),
					true,
				]),
				{ gasLimit: 800000 }
			)).to.be.revertedWith('access-forbidden');
		});

	});

	describe('Initialize', async () => {

		it ("reintrance protection", async () => {
			expect(proxyAsWallet.connect(user1).initialize(user2.address)).to.be.revertedWith('already-initialized');
		});

	});



});
