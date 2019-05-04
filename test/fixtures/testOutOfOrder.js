const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');
const {relayMetaTx,prepareMetaTx} = require('../../utils/utils.js');

const {expect} = chai;
chai.use(solidity);

function testOutOfOrder(provider, executeabi, addrToKey = ethers.utils.keccak256)
{
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

	describe('testOutOfOrder', async () => {

		it('valid nonce', async () => {
			expect(await proxyAsWallet.nonce()).to.be.eq(0);
			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{ to: dest, nonce: 1 },
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);
			expect(await proxyAsWallet.nonce()).to.be.eq(1);
		});

		it('invalid nonce', async () => {
			expect(await proxyAsWallet.nonce()).to.be.eq(0);
			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{ to: dest, nonce: 2 },
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to.be.revertedWith('invalid-nonce');
			expect(await proxyAsWallet.nonce()).to.be.eq(0);
		});

		it('out-of-order with salt', async () => {
			expect(await proxyAsWallet.nonce()).to.be.eq(0);
			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{ to: dest, nonce: 0 },
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);
			expect(await proxyAsWallet.nonce()).to.be.eq(1);
		});

		it('out-of-order with salt (multiple)', async () => {
			expect(await proxyAsWallet.nonce()).to.be.eq(0);
			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{ to: dest, nonce: 0 },
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);
			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{ to: dest, nonce: 0 },
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);
			expect(await proxyAsWallet.nonce()).to.be.eq(2);
		});

		it('out-of-order replay protection', async () => {
			samesalt = ethers.utils.randomBytes(32);
			expect(await proxyAsWallet.nonce()).to.be.eq(0);
			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{ to: dest, nonce: 0, salt: samesalt },
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);
			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{ to: dest, nonce: 0, salt: samesalt },
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to.revertedWith('transaction-replay');
			expect(await proxyAsWallet.nonce()).to.be.eq(1);
		});

		it('out-of-order replay protection (different signers)', async () => {
			samesalt = ethers.utils.randomBytes(32);
			expect(await proxyAsWallet.nonce()).to.be.eq(0);
			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: proxyAsWallet.address,
						data: proxyAsWallet.interface.functions.setKey.encode([
							addrToKey(user2.address),
							'0x0000000000000000000000000000000000000000000000000000000000000007'
						]),
					},
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to
			.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
			.emit(proxyAsWallet, 'SetKey').withArgs(addrToKey(user2.address), "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000007");
			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{ to: dest, nonce: 0, salt: samesalt },
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);
			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{ to: dest, nonce: 0, salt: samesalt },
					[ user2 ],
					executeabi,
				),
				relayer,
			)).to.revertedWith('transaction-replay');
			expect(await proxyAsWallet.nonce()).to.be.eq(2);
		});

	});
}

module.exports = testOutOfOrder;
