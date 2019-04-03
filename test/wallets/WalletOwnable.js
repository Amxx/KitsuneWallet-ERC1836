const chai   = require('chai');
const ethers = require('ethers');
const {createMockProvider, deployContract, getWallets, solidity} = require('ethereum-waffle');

const Proxy         = require('../../build/Proxy');
const WalletOwnable = require('../../build/WalletOwnable');
const Target        = require('../../build/Target');

const {expect} = chai;
chai.use(solidity);
ethers.errors.setLogLevel('error');

describe('WalletOwnable', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);

	before(async () => {
		walletContract = await deployContract(wallet, WalletOwnable, []);
		targetContract = await deployContract(wallet, Target, []);
		dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));
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

			await expect(proxyAsWallet.connect(user1).execute(
				0,
				dest,
				500,
				[],
				{ gasLimit: 80000 }
			)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);

			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(500);
			expect(await provider.getBalance(dest                 )).to.eq(500);
		});

		it ("authorized - call with proxy", async () => {
			randomdata = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			await expect(proxyAsWallet.connect(user1).execute(
				0,
				targetContract.address,
				0,
				targetContract.interface.functions.call.encode([ randomdata ]),
				{ gasLimit: 80000 }
			)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(targetContract.address);

			expect(await targetContract.lastSender()).to.eq(proxyAsWallet.address);
			expect(await targetContract.lastData()).to.eq(randomdata);
		});

		it("protected", async () => {
			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(1000);

			await expect(proxyAsWallet.connect(user2).execute(
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
			await expect(proxyAsWallet.connect(user1).transferOwnership(
				user2.address,
				{ gasLimit: 80000 }
			)).to.emit(proxyAsWallet, 'OwnershipTransferred').withArgs(user1.address, user2.address);

			expect(await proxyAsWallet.owner()).to.eq(user2.address);
		});

		it("protected", async () => {
			await expect(proxyAsWallet.connect(user2).transferOwnership(
				user2.address,
				{ gasLimit: 80000 }
			)).to.be.reverted;
		});

	});

	describe('UpdateMaster', async () => {

		it("authorized", async () => {
			await expect(proxyAsWallet.connect(user1).execute(
				0,
				proxyAsWallet.address,
				0,
				proxyAsWallet.interface.functions.updateMaster.encode([
					walletContract.address,
					walletContract.interface.functions.initialize.encode([ user2.address ]),
					true,
				]),
				{ gasLimit: 800000 }
			)).to
			.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
			.emit(proxyAsWallet, 'MasterChange').withArgs(walletContract.address, walletContract.address);

			expect(await proxyAsWallet.owner()).to.eq(user2.address);
		});

		it ("protected", async () => {
			await expect(proxyAsWallet.connect(user2).execute(
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
			await expect(proxyAsWallet.connect(user1).initialize(user2.address)).to.be.revertedWith('already-initialized');
		});

	});



});
