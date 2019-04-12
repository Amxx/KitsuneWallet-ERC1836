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

	describe('Refund', async () => {
		it('authorized - pay with proxy', async () => {
			expect(await relayerProxyAsWallet.getKey(ethers.utils.keccak256(relayer.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');

			expect(await provider.getBalance(proxyAsWallet.address       )).to.eq(eth(1.0));
			expect(await provider.getBalance(relayerProxyAsWallet.address)).to.eq(eth(0.0));
			expect(await provider.getBalance(dest                        )).to.eq(eth(0.0));

			const gasPrice = 20 * 10**9; // 20gwai
			await expect(relayMetaTx(
				await prepareMetaTx(
					relayerProxyAsWallet,
					{
						...await prepareMetaTx(
							proxyAsWallet,
							{
								to:       dest,
								value:    eth(0.1),
								nonce:    1,
								gasPrice,
							},
							[user1],
							executeabi
						),
						nonce: 1,
					},
					[ relayer ],
					executeabi
				),
				relayer,
			)).to
			// .emit(relayerProxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
			.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);

			const proxyBalanceDelta        = (await provider.getBalance(proxyAsWallet.address)).sub(eth(0.9));
			const relayerProxyBalanceDelta = (await provider.getBalance(relayerProxyAsWallet.address));
			expect(proxyBalanceDelta.add(relayerProxyBalanceDelta)).to.eq(0);

			console.log("gas refunded:", relayerProxyBalanceDelta.div(gasPrice).toNumber());

			expect(await provider.getBalance(proxyAsWallet.address       )).to.eq(eth(0.9).sub(relayerProxyBalanceDelta));
			expect(await provider.getBalance(relayerProxyAsWallet.address)).to.eq(eth(0.0).add(relayerProxyBalanceDelta));
			expect(await provider.getBalance(dest                        )).to.eq(eth(0.1));
		});
	});
}

module.exports = testExecute;
