const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');
const {relayMetaTx,prepareMetaTx} = require('../../utils/utils.js');

const {expect} = chai;
chai.use(solidity);

eth = x => ethers.utils.parseEther(x.toString())
function testExecute(provider, executeabi)
{
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

	describe('Execute', async () => {
		it('authorized - pay with proxy', async () => {
			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(eth(1.0));
			expect(await provider.getBalance(dest                 )).to.eq(eth(0.0));

			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{
						to:    dest,
						value: eth(0.1),
						nonce: 1,
					},
					[ user1 ],
					executeabi
				),
				relayer,
			)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);

			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(eth(0.9));
			expect(await provider.getBalance(dest                 )).to.eq(eth(0.1));
		});

		it('authorized - call with proxy', async () => {
			randomdata = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: targetContract.address,
						data: targetContract.interface.functions.call.encode([ randomdata ]),
						nonce: 1,
					},
					[ user1 ],
					executeabi
				),
				relayer,
			)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(targetContract.address);

			expect(await targetContract.lastSender()).to.eq(proxyAsWallet.address);
			expect(await targetContract.lastData()).to.eq(randomdata);
		});

		it('protected', async () => {
			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(eth(1.0));

			await expect(proxyAsWallet.connect(user1).execute(
				0,
				user1.address,
				eth(0.1),
				[],
				{ gasLimit: 80000 }
			)).to.be.revertedWith('access-forbidden');

			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(eth(1.0));
		});
	});
}

module.exports = testExecute;
