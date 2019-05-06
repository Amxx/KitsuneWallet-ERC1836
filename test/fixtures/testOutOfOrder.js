const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);

function testOutOfOrder(sdk)
{
	describe('testOutOfOrder', async () => {

		const [ wallet, relayer, user1, user2, user3 ] = getWallets(sdk.provider);
		const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

		it('valid nonce', async () => {
			expect(await proxy.nonce()).to.be.eq(0);
			await expect(sdk.relayMetaTx(
				await sdk.prepareMetaTx(
					proxy,
					{ to: dest, nonce: 1 },
					[ user1 ],
				),
				relayer,
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			expect(await proxy.nonce()).to.be.eq(1);
		});

		it('invalid nonce', async () => {
			expect(await proxy.nonce()).to.be.eq(0);
			await expect(sdk.relayMetaTx(
				await sdk.prepareMetaTx(
					proxy,
					{ to: dest, nonce: 2 },
					[ user1 ],
				),
				relayer,
			)).to.be.revertedWith('invalid-nonce');
			expect(await proxy.nonce()).to.be.eq(0);
		});

		it('out-of-order with salt', async () => {
			expect(await proxy.nonce()).to.be.eq(0);
			await expect(sdk.relayMetaTx(
				await sdk.prepareMetaTx(
					proxy,
					{ to: dest, nonce: 0 },
					[ user1 ],
				),
				relayer,
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			expect(await proxy.nonce()).to.be.eq(1);
		});

		it('out-of-order with salt (multiple)', async () => {
			expect(await proxy.nonce()).to.be.eq(0);
			await expect(sdk.relayMetaTx(
				await sdk.prepareMetaTx(
					proxy,
					{ to: dest, nonce: 0 },
					[ user1 ],
				),
				relayer,
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			await expect(sdk.relayMetaTx(
				await sdk.prepareMetaTx(
					proxy,
					{ to: dest, nonce: 0 },
					[ user1 ],
				),
				relayer,
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			expect(await proxy.nonce()).to.be.eq(2);
		});

		it('out-of-order replay protection', async () => {
			samesalt = ethers.utils.randomBytes(32);
			expect(await proxy.nonce()).to.be.eq(0);
			await expect(sdk.relayMetaTx(
				await sdk.prepareMetaTx(
					proxy,
					{ to: dest, nonce: 0, salt: samesalt },
					[ user1 ],
				),
				relayer,
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			await expect(sdk.relayMetaTx(
				await sdk.prepareMetaTx(
					proxy,
					{ to: dest, nonce: 0, salt: samesalt },
					[ user1 ],
				),
				relayer,
			)).to.revertedWith('transaction-replay');
			expect(await proxy.nonce()).to.be.eq(1);
		});

		it('out-of-order replay protection (different signers)', async () => {
			samesalt = ethers.utils.randomBytes(32);
			expect(await proxy.nonce()).to.be.eq(0);
			await expect(sdk.setKey(
				proxy,
				sdk.addrToKey(user2.address),
				'0x0000000000000000000000000000000000000000000000000000000000000007',
				[ user1 ],
				relayer,
			)).to
			.emit(proxy, 'CallSuccess').withArgs(proxy.address)
			.emit(proxy, 'SetKey').withArgs(sdk.addrToKey(user2.address), "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000007");
			await expect(sdk.relayMetaTx(
				await sdk.prepareMetaTx(
					proxy,
					{ to: dest, nonce: 0, salt: samesalt },
					[ user1 ],
				),
				relayer,
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			await expect(sdk.relayMetaTx(
				await sdk.prepareMetaTx(
					proxy,
					{ to: dest, nonce: 0, salt: samesalt },
					[ user2 ],
				),
				relayer,
			)).to.revertedWith('transaction-replay');
			expect(await proxy.nonce()).to.be.eq(2);
		});

	});
}

module.exports = testOutOfOrder;
