const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');
const {sendMetaTx} = require('../utils.js')

const {expect} = chai;
chai.use(solidity);

function testMultisig(provider, executeabi, extra = [])
{
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

	describe('Multisig', async () => {

		describe('Nonce', async () => {
			it('valid', async () => {
				expect(await proxyAsWallet.nonce()).to.be.eq(0);

				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,    // type
						dest, // to
						0,    // value
						[],   // data
						1,    // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);

				expect(await proxyAsWallet.nonce()).to.be.eq(1);
			});

			it('invalid', async () => {
				expect(await proxyAsWallet.nonce()).to.be.eq(0);

				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,    // type
						dest, // to
						500,  // value
						[],   // data
						42,   // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to.be.revertedWith('invalid-nonce');

				expect(await proxyAsWallet.nonce()).to.be.eq(0);
			});
		});

		describe('Change management threshold', async () => {
			it('valid', async () => {
				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);

				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                // type
						proxyAsWallet.address,                            // to
						0,                                                // value
						proxyAsWallet.interface.functions.setKey.encode([
							ethers.utils.keccak256(user2.address),
							'0x0000000000000000000000000000000000000000000000000000000000000001',
						]),                                               // data
						1,                                                // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                                    // type
						proxyAsWallet.address,                                                // to
						0,                                                                    // value
						proxyAsWallet.interface.functions.setManagementThreshold.encode([2]), // data
						2,                                                                    // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to
				.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
				.emit(proxyAsWallet, 'ManagementThresholdChange').withArgs(1, 2);

				expect(await proxyAsWallet.getManagementThreshold()).to.eq(2);
			});

			it('invalid (too low)', async () => {
				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);

				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                                    // type
						proxyAsWallet.address,                                                // to
						0,                                                                    // value
						proxyAsWallet.interface.functions.setManagementThreshold.encode([0]), // data
						1,                                                                    // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallFailure'); //.withArgs(proxyAsWallet.address, 'threshold-too-low');

				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);
			});

			it('invalid (too high)', async () => {
				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);

				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                                    // type
						proxyAsWallet.address,                                                // to
						0,                                                                    // value
						proxyAsWallet.interface.functions.setManagementThreshold.encode([2]), // data
						1,                                                                    // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallFailure'); //.withArgs(proxyAsWallet.address, 'threshold-too-high');

				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);
			});
		});

		describe('Manage with multiple signatures', async () => {
			it('valid', async () => {
				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);

				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                // type
						proxyAsWallet.address,                            // to
						0,                                                // value
						proxyAsWallet.interface.functions.setKey.encode([
							ethers.utils.keccak256(user2.address),
							'0x0000000000000000000000000000000000000000000000000000000000000001',
						]),                                               // data
						1,                                                // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                                    // type
						proxyAsWallet.address,                                                // to
						0,                                                                    // value
						proxyAsWallet.interface.functions.setManagementThreshold.encode([2]), // data
						2,                                                                    // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to
				.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
				.emit(proxyAsWallet, 'ManagementThresholdChange').withArgs(1, 2);
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                                    // type
						proxyAsWallet.address,                                                // to
						0,                                                                    // value
						proxyAsWallet.interface.functions.setManagementThreshold.encode([1]), // data
						3,                                                                    // nonce
						...extra
					],
					[ user1, user2 ],
					relayer,
					executeabi
				)).to
				.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
				.emit(proxyAsWallet, 'ManagementThresholdChange').withArgs(2, 1);


				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);
			});

			it('invalid', async () => {
				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);

				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                // type
						proxyAsWallet.address,                            // to
						0,                                                // value
						proxyAsWallet.interface.functions.setKey.encode([
							ethers.utils.keccak256(user2.address),
							'0x0000000000000000000000000000000000000000000000000000000000000001',
						]),                                               // data
						1,                                                // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                                    // type
						proxyAsWallet.address,                                                // to
						0,                                                                    // value
						proxyAsWallet.interface.functions.setManagementThreshold.encode([2]), // data
						2,                                                                    // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to
				.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
				.emit(proxyAsWallet, 'ManagementThresholdChange').withArgs(1, 2);
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                                    // type
						proxyAsWallet.address,                                                // to
						0,                                                                    // value
						proxyAsWallet.interface.functions.setManagementThreshold.encode([1]), // data
						3,                                                                    // nonce
						...extra
					],
					[ user2 ],
					relayer,
					executeabi
				)).to.be.revertedWith('missing-signers');

				expect(await proxyAsWallet.getManagementThreshold()).to.eq(2);
			});
		});
		describe('Change execution threshold', async () => {
			it('valid', async () => {
				expect(await proxyAsWallet.getActionThreshold()).to.eq(1);

				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                                // type
						proxyAsWallet.address,                                            // to
						0,                                                                // value
						proxyAsWallet.interface.functions.setActionThreshold.encode([2]), // data
						1,                                                                // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to
				.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
				.emit(proxyAsWallet, 'ActionThresholdChange').withArgs(1, 2);

				expect(await proxyAsWallet.getActionThreshold()).to.eq(2);
			});

			it('invalid', async () => {
				expect(await proxyAsWallet.getActionThreshold()).to.eq(1);

				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                                // type
						proxyAsWallet.address,                                            // to
						0,                                                                // value
						proxyAsWallet.interface.functions.setActionThreshold.encode([0]), // data
						1,                                                                // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallFailure'); //.withArgs(proxyAsWallet.address, 'threshold-too-low');

				expect(await proxyAsWallet.getActionThreshold()).to.eq(1);
			});
		});

		describe('Execute with multiple signatures', async () => {
			it('valid', async () => {
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                // type
						proxyAsWallet.address,                            // to
						0,                                                // value
						proxyAsWallet.interface.functions.setKey.encode([
							ethers.utils.keccak256(user2.address),
							'0x0000000000000000000000000000000000000000000000000000000000000006'
						]),                                               // data
						1,                                                // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                                // type
						proxyAsWallet.address,                                            // to
						0,                                                                // value
						proxyAsWallet.interface.functions.setActionThreshold.encode([2]), // data
						2,                                                                // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,    // type
						dest, // to
						0,    // value
						[],   // data
						3,    // nonce
						...extra
					],
					[ user1, user2 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,    // type
						dest, // to
						0,    // value
						[],   // data
						4,    // nonce
						...extra
					],
					[ user2, user1 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);
			});

			it('invalid - unauthorized signer', async () => {
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                                // type
						proxyAsWallet.address,                                            // to
						0,                                                                // value
						proxyAsWallet.interface.functions.setActionThreshold.encode([2]), // data
						1,                                                                // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,    // type
						dest, // to
						0,  // value
						[],   // data
						2,    // nonce
						...extra
					],
					[ user1, user2 ],
					relayer,
					executeabi
				)).to.be.revertedWith('invalid-signature');
			});

			it('invalid - multiple signer', async () => {
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,                                                                // type
						proxyAsWallet.address,                                            // to
						0,                                                                // value
						proxyAsWallet.interface.functions.setActionThreshold.encode([2]), // data
						1,                                                                // nonce
						...extra
					],
					[ user1 ],
					relayer,
					executeabi
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
				await expect(sendMetaTx(
					proxyAsWallet,
					[
						0,    // type
						dest, // to
						0,  // value
						[],   // data
						2,    // nonce
						...extra
					],
					[ user1, user1 ],
					relayer,
					executeabi
				)).to.be.revertedWith('invalid-signatures-ordering');
			});
		});
	});
}

module.exports = testMultisig;
