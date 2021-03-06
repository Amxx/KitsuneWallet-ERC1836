const chai   = require('chai');
const ethers = require('ethers');
const { solidity } = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);

eth = x => ethers.utils.parseEther(x.toString())
function testExecute(sdk)
{
	describe('Execute', async () => {

		const [ wallet, relayer, user1, user2, user3 ] = sdk.provider.getWallets();
		const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

		it('authorized - pay with proxy', async () => {
			expect(await sdk.provider.getBalance(proxy.address)).to.be.eq(eth(1.0));
			expect(await sdk.provider.getBalance(dest         )).to.be.eq(eth(0.0));

			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{
					to:    dest,
					value: eth(0.1),
				},
				{ options: { gasLimit: 1000000 } }
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);

			expect(await sdk.provider.getBalance(proxy.address)).to.be.eq(eth(0.9));
			expect(await sdk.provider.getBalance(dest         )).to.be.eq(eth(0.1));
		});

		it('authorized - call with proxy', async () => {
			randomdata = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{
					to: targetContract.address,
					data: targetContract.interface.functions.call.encode([ randomdata ]),
				},
				{ options: { gasLimit: 1000000 } }
			)).to.emit(proxy, 'CallSuccess').withArgs(targetContract.address);

			expect(await targetContract._lastSender()).to.be.eq(proxy.address);
			expect(await targetContract._lastData()).to.be.eq(randomdata);
		});

		it('protected', async () => {
			expect(await sdk.provider.getBalance(proxy.address)).to.be.eq(eth(1.0));

			await expect(proxy.connect(user1).execute(
				0,
				user1.address,
				eth(0.1),
				[],
				{ gasLimit: 80000 }
			)).to.be.revertedWith('access-denied');

			expect(await sdk.provider.getBalance(proxy.address)).to.be.eq(eth(1.0));
		});
	});
}

module.exports = testExecute;
