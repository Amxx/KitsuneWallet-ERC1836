const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');
const {relayMetaTx,prepareMetaTx} = require('../utils.js');

const {expect} = chai;
chai.use(solidity);

function testKeyManagement(provider, executeabi)
{
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

	describe('Key Management', async () => {
		it('keyHasPurpose', async () => {
			expect(await proxyAsWallet.keyHasPurpose(
				ethers.utils.keccak256(user1.address),
				'0x0000000000000000000000000000000000000000000000000000000000000001',
			)).to.be.eq(true);
			expect(await proxyAsWallet.keyHasPurpose(
				ethers.utils.keccak256(user1.address),
				'0x0000000000000000000000000000000000000000000000000000000000000002',
			)).to.be.eq(true);
			expect(await proxyAsWallet.keyHasPurpose(
				ethers.utils.keccak256(user1.address),
				'0x0000000000000000000000000000000000000000000000000000000000000004',
			)).to.be.eq(true);
			expect(await proxyAsWallet.keyHasPurpose(
				ethers.utils.keccak256(user1.address),
				'0x0000000000000000000000000000000000000000000000000000000000000008',
			)).to.be.eq(false);
			expect(await proxyAsWallet.keyHasPurpose(
				ethers.utils.keccak256(user1.address),
				'0x0000000000000000000000000000000000000000000000000000000000000007',
			)).to.be.eq(true);
			expect(await proxyAsWallet.keyHasPurpose(
				ethers.utils.keccak256(user1.address),
				'0x0000000000000000000000000000000000000000000000000000000000000009',
			)).to.be.eq(false);
		});

		it('AddKey', async () => {
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);

			await expect(relayMetaTx(
				proxyAsWallet,
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: proxyAsWallet.address,
						data: proxyAsWallet.interface.functions.setKey.encode([
							ethers.utils.keccak256(user2.address),
							'0x0000000000000000000000000000000000000000000000000000000000000004'
						]),
						nonce: 1,
					},
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to
			.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
			.emit(proxyAsWallet, 'SetKey').withArgs(ethers.utils.keccak256(user2.address), "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000004");

			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000004');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address),ethers.utils.keccak256(user2.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);
		});

		it('UpdateKey', async () => {
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);

			await expect(relayMetaTx(
				proxyAsWallet,
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: proxyAsWallet.address,
						data: proxyAsWallet.interface.functions.setKey.encode([
							ethers.utils.keccak256(user1.address),
							'0x000000000000000000000000000000000000000000000000000000000000000f',
						]),
						nonce: 1,
					},
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to
			.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
			.emit(proxyAsWallet, 'SetKey').withArgs(ethers.utils.keccak256(user1.address), "0x0000000000000000000000000000000000000000000000000000000000000007", "0x000000000000000000000000000000000000000000000000000000000000000f");

			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq('0x000000000000000000000000000000000000000000000000000000000000000f');
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);
		});

		it('Cannot remove last management key', async () => {
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);

			await expect(relayMetaTx(
				proxyAsWallet,
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: proxyAsWallet.address,
						data: proxyAsWallet.interface.functions.setKey.encode([
							ethers.utils.keccak256(user1.address),
							'0x0000000000000000000000000000000000000000000000000000000000000006',
						]),
						nonce: 1,
					},
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to.emit(proxyAsWallet, 'CallFailure'); //.withArgs(proxyAsWallet.address, 'cannot-remove-critical-management-key');

			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);
		});

		it('Add then Remove', async () => {

			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);

			await expect(relayMetaTx(
				proxyAsWallet,
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: proxyAsWallet.address,
						data: proxyAsWallet.interface.functions.setKey.encode([
							ethers.utils.keccak256(user2.address),
							'0x0000000000000000000000000000000000000000000000000000000000000007',
						]),
						nonce: 1,
					},
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to
			.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
			.emit(proxyAsWallet, 'SetKey').withArgs(ethers.utils.keccak256(user2.address), "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000007");


			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user1.address),ethers.utils.keccak256(user2.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(2);

			await expect(relayMetaTx(
				proxyAsWallet,
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: proxyAsWallet.address,
						data: proxyAsWallet.interface.functions.setKey.encode([
							ethers.utils.keccak256(user1.address),
							'0x0000000000000000000000000000000000000000000000000000000000000000',
						]),
						nonce: 2,
					},
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to
			.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
			.emit(proxyAsWallet, 'SetKey').withArgs(ethers.utils.keccak256(user1.address), "0x0000000000000000000000000000000000000000000000000000000000000007", "0x0000000000000000000000000000000000000000000000000000000000000000");

			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([ethers.utils.keccak256(user2.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);
		});
	});
}

module.exports = testKeyManagement;
