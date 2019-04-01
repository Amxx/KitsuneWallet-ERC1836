const chai   = require('chai');
const ethers = require('ethers');
const {createMockProvider, deployContract, getWallets, solidity} = require('ethereum-waffle');
const {sendMetaTx} = require('../utils.js')

const Proxy          = require('../../build/Proxy');
const WalletMultisig = require('../../build/WalletMultisig');
const Target         = require('../../build/Target');

const {expect} = chai;
chai.use(solidity);
ethers.errors.setLogLevel('error');

describe('WalletMultisig', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);

	before(async () => {
		walletContract = await deployContract(wallet, WalletMultisig, []);
		targetContract = await deployContract(wallet, Target, []);
		dest = ethers.utils.hexlify(ethers.utils.randomBytes(20));
	});

	beforeEach(async () => {
		proxyContract = await deployContract(wallet, Proxy, [
			walletContract.address,
			walletContract.interface.functions.initialize.encode([
				[
					ethers.utils.keccak256(user1.address),
				],
				[
					"0x0000000000000000000000000000000000000000000000000000000000000007",
				],
				1,
				1,
			])
		]);
		proxyAsWallet = new ethers.Contract(proxyContract.address, WalletMultisig.abi, provider);

		await wallet.sendTransaction({to: proxyAsWallet.address, value: 1000});
	});

	it ('Verify proxy initialization', async () => {
		expect(await proxyAsWallet.owner()).to.eq(proxyAsWallet.address);
		expect(await proxyAsWallet.master()).to.eq(walletContract.address);
		expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);
		expect(await proxyAsWallet.getActionThreshold()).to.eq(1);
	});

	describe('Execute', async () => {

		it ('authorized - pay with proxy', async () => {
			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(1000);
			expect(await provider.getBalance(dest                 )).to.eq(   0);

			const transaction = await sendMetaTx(
				proxyAsWallet,
				[
					0,    // type
					dest, // to
					500,  // value
					[],   // data
					1,    // nonce
				],
				[ user1 ],
				relayer,
				'execute(uint256,address,uint256,bytes,uint256,bytes[])'
			)
			const {gasUsed} = await provider.getTransactionReceipt(transaction.hash);

			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(500);
			expect(await provider.getBalance(dest                 )).to.eq(500);
		});

		it ('authorized - call with proxy', async () => {
			randomdata = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			const transaction = await sendMetaTx(
				proxyAsWallet,
				[
					0,                                                              // type
					targetContract.address,                                         // to
					0,                                                              // value
					targetContract.interface.functions.call.encode([ randomdata ]), // data
					1,                                                              // nonce
				],
				[ user1 ],
				relayer,
				'execute(uint256,address,uint256,bytes,uint256,bytes[])'
			)
			const {gasUsed} = await provider.getTransactionReceipt(transaction.hash);

			expect(await targetContract.lastSender()).to.eq(proxyAsWallet.address);
			expect(await targetContract.lastData()).to.eq(randomdata);
		});

		it('protected', async () => {
			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(1000);

			expect(proxyAsWallet.connect(user1).execute(
				0,
				user1.address,
				500,
				[],
				{ gasLimit: 80000 }
			)).to.be.revertedWith('access-forbidden');

			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(1000);
		});
	});

	describe('Key Management', async () => {
		it('keyHasPurpose', async () => {
			expect(await proxyAsWallet.keyHasPurpose(
				ethers.utils.keccak256(user1.address),
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			)).to.be.eq(true);
			expect(await proxyAsWallet.keyHasPurpose(
				ethers.utils.keccak256(user1.address),
				"0x0000000000000000000000000000000000000000000000000000000000000002",
			)).to.be.eq(true);
			expect(await proxyAsWallet.keyHasPurpose(
				ethers.utils.keccak256(user1.address),
				"0x0000000000000000000000000000000000000000000000000000000000000004",
			)).to.be.eq(true);
			expect(await proxyAsWallet.keyHasPurpose(
				ethers.utils.keccak256(user1.address),
				"0x0000000000000000000000000000000000000000000000000000000000000008",
			)).to.be.eq(false);
			expect(await proxyAsWallet.keyHasPurpose(
				ethers.utils.keccak256(user1.address),
				"0x0000000000000000000000000000000000000000000000000000000000000007",
			)).to.be.eq(true);
			expect(await proxyAsWallet.keyHasPurpose(
				ethers.utils.keccak256(user1.address),
				"0x0000000000000000000000000000000000000000000000000000000000000009",
			)).to.be.eq(false);
		});

		it('AddKey', async () => {
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000007");
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000000");
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address)]);
			expect(await proxyAsWallet.m_managementKeyCount()).to.be.eq(1);

			const transaction = await sendMetaTx(
				proxyAsWallet,
				[
					0,                                                // type
					proxyAsWallet.address,                            // to
					0,                                                // value
					proxyAsWallet.interface.functions.setKey.encode([
						ethers.utils.keccak256(user2.address),
						"0x0000000000000000000000000000000000000000000000000000000000000004"
					]),                                               // data
					1,                                                // nonce
				],
				[ user1 ],
				relayer,
				'execute(uint256,address,uint256,bytes,uint256,bytes[])'
			);

			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000007");
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000004");
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address),ethers.utils.keccak256(user2.address)]);
			expect(await proxyAsWallet.m_managementKeyCount()).to.be.eq(1);
		});

		it('UpdateKey', async () => {
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000007");
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000000");
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address)]);
			expect(await proxyAsWallet.m_managementKeyCount()).to.be.eq(1);

			const transaction = await sendMetaTx(
				proxyAsWallet,
				[
					0,                                                // type
					proxyAsWallet.address,                            // to
					0,                                                // value
					proxyAsWallet.interface.functions.setKey.encode([
						ethers.utils.keccak256(user1.address),
						"0x000000000000000000000000000000000000000000000000000000000000000f",
					]),                                               // data
					1,                                                // nonce
				],
				[ user1 ],
				relayer,
				'execute(uint256,address,uint256,bytes,uint256,bytes[])'
			);

			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq("0x000000000000000000000000000000000000000000000000000000000000000f");
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000000");
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address)]);
			expect(await proxyAsWallet.m_managementKeyCount()).to.be.eq(1);
		});

		it('Cannot remove last management key', async () => {
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000007");
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000000");
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address)]);
			expect(await proxyAsWallet.m_managementKeyCount()).to.be.eq(1);

			expect(sendMetaTx(
				proxyAsWallet,
				[
					0,                                                // type
					proxyAsWallet.address,                            // to
					0,                                                // value
					proxyAsWallet.interface.functions.setKey.encode([
						ethers.utils.keccak256(user1.address),
						"0x0000000000000000000000000000000000000000000000000000000000000006",
					]),                                               // data
					1,                                                // nonce
				],
				[ user1 ],
				relayer,
				'execute(uint256,address,uint256,bytes,uint256,bytes[])'
			)).to.be.revertedWith('cannot-remove-critical-management-key');

			expect(await proxyAsWallet.m_managementKeyCount()).to.be.eq(1);
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000007");
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000000");
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address)]);
		});

		it('Add then Remove', async () => {

			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000007");
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000000");
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address)]);
			expect(await proxyAsWallet.m_managementKeyCount()).to.be.eq(1);

			await sendMetaTx(
				proxyAsWallet,
				[
					0,                                                // type
					proxyAsWallet.address,                            // to
					0,                                                // value
					proxyAsWallet.interface.functions.setKey.encode([
						ethers.utils.keccak256(user2.address),
						"0x0000000000000000000000000000000000000000000000000000000000000007",
					]),                                               // data
					1,                                                // nonce
				],
				[ user1 ],
				relayer,
				'execute(uint256,address,uint256,bytes,uint256,bytes[])'
			);

			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000007");
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000007");
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address),ethers.utils.keccak256(user2.address)]);
			expect(await proxyAsWallet.m_managementKeyCount()).to.be.eq(2);

			await sendMetaTx(
				proxyAsWallet,
				[
					0,                                                // type
					proxyAsWallet.address,                            // to
					0,                                                // value
					proxyAsWallet.interface.functions.setKey.encode([
						ethers.utils.keccak256(user1.address),
						"0x0000000000000000000000000000000000000000000000000000000000000000",
					]),                                               // data
					2,                                                // nonce
				],
				[ user1 ],
				relayer,
				'execute(uint256,address,uint256,bytes,uint256,bytes[])'
			);

			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000000");
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq("0x0000000000000000000000000000000000000000000000000000000000000007");
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user2.address)]);
			expect(await proxyAsWallet.m_managementKeyCount()).to.be.eq(1);
		});
	});

	describe('Multisig', async () => {

		describe('Nonce', async () => {
			it('valid', async () => {});
			it('invalid', async () => {
				expect(proxyAsWallet.connect(user1).functions['execute(uint256,address,uint256,bytes,uint256,bytes[])'](0, dest, 0, [], 0, [], { gasLimit: 80000 }))
					.to.be.revertedWith("invalid-nonce")
			});
		});

		// describe('Change management threshold', async () => {
		// 	it('valid', async () => {});
		// 	it('invalid', async () => {});
		// });
		// describe('Manage with multiple signatures', async () => {
		// 	it('valid', async () => {});
		// 	it('invalid', async () => {});
		// });
		// describe('Change execution threshold', async () => {
		// 	it('valid', async () => {});
		// 	it('invalid', async () => {});
		// });
		// describe('Execute with multiple signatures', async () => {
		// 	it('valid', async () => {});
		// 	it('invalid', async () => {});
		// });

	});






	// describe('UpdateMaster', async () => {
	//
	// 	it('authorized', async () => {
	// 		const transaction = await proxyAsWallet.connect(user1).execute(
	// 			0,
	// 			proxyAsWallet.address,
	// 			0,
	// 			proxyAsWallet.interface.functions.updateMaster.encode([
	// 				walletContract.address,
	// 				walletContract.interface.functions.initialize.encode([ user2.address ]),
	// 				true,
	// 			]),
	// 			{ gasLimit: 800000 }
	// 		)
	// 		const {gasUsed} = await provider.getTransactionReceipt(transaction.hash);
	//
	// 		expect(await proxyAsWallet.owner()).to.eq(user2.address);
	// 	});
	//
	// 	it ('protected', async () => {
	// 		expect(proxyAsWallet.connect(user2).execute(
	// 			0,
	// 			proxyAsWallet.address,
	// 			0,
	// 			proxyAsWallet.interface.functions.updateMaster.encode([
	// 				walletContract.address,
	// 				walletContract.interface.functions.initialize.encode([ user2.address ]),
	// 				true,
	// 			]),
	// 			{ gasLimit: 800000 }
	// 		)).to.be.revertedWith('access-forbidden');
	// 	});
	//
	// });
	//
	// describe('Initialize', async () => {
	//
	// 	it ('reintrance protection', async () => {
	// 		expect(proxyAsWallet.connect(user1).initialize(user2.address)).to.be.revertedWith('already-initialized');
	// 	});
	//
	// });



});
