const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);

function testRefund(sdk)
{
	describe('Refund', async () => {

		const [ wallet, relayer, user1, user2, user3 ] = getWallets(sdk.provider);
		const eth = x => ethers.utils.parseEther(x.toString())

		it('Refund in ether', async () => {
			const gasToken = ethers.constants.AddressZero;
			const gasPrice = 20 * 10**9; // 20gwai
			const dest     = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

			expect(await relayerProxy.getKey(sdk.utils.addrToKey(relayer.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');

			expect(await sdk.provider.getBalance(proxy.address       )).to.be.eq(eth(1.0));
			expect(await sdk.provider.getBalance(relayerProxy.address)).to.be.eq(eth(0.0));
			expect(await sdk.provider.getBalance(dest                )).to.be.eq(eth(0.0));

			await expect(sdk.multisig.execute(
				relayerProxy,
				[ relayer ],
				{
					...await  sdk.multisig.sign(
						proxy,
						[user1],
						{
							to:       dest,
							value:    eth(0.1),
							gasToken,
							gasPrice,
						},
					),
				},
				{ options: { gasLimit: 1000000 } }
			)).to
			// .emit(relayerProxy, 'CallSuccess').withArgs(proxy.address);
			.emit(proxy, 'CallSuccess').withArgs(dest);

			const proxyBalanceDelta        = (await sdk.provider.getBalance(proxy.address)).sub(eth(0.9));
			const relayerProxyBalanceDelta = (await sdk.provider.getBalance(relayerProxy.address));
			expect(proxyBalanceDelta.add(relayerProxyBalanceDelta)).to.be.eq(0);

			console.log("gas refunded:", relayerProxyBalanceDelta.div(gasPrice).toNumber());

			expect(await sdk.provider.getBalance(proxy.address       )).to.be.eq(eth(0.9).sub(relayerProxyBalanceDelta));
			expect(await sdk.provider.getBalance(relayerProxy.address)).to.be.eq(eth(0.0).add(relayerProxyBalanceDelta));
			expect(await sdk.provider.getBalance(dest                )).to.be.eq(eth(0.1));
		});

		it('Refund in ether - Fine Tunning', async () => {
			const gasToken = ethers.constants.AddressZero;
			const gasPrice = 2000000000;
			const dest     = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');

			expect(await sdk.provider.getBalance(proxy.address)).to.be.eq(eth(1.0));
			expect(await sdk.provider.getBalance(dest         )).to.be.eq(eth(0.0));

			const balanceBefore = await sdk.provider.getBalance(relayer.address);
			const tx = await sdk.multisig.execute(
				proxy,
				[user1],
				{
					to:       dest,
					value:    eth(0.1),
					gasToken,
					gasPrice,
				},
				{ options: { gasLimit: 1000000 } }
			);
			const receipt = await tx.wait();
			const balanceAfter = await sdk.provider.getBalance(relayer.address);

			const proxyBalanceDelta   = (await sdk.provider.getBalance(proxy.address)).sub(eth(0.9));
			const relayerBalanceDelta = balanceBefore.sub(balanceAfter);

			console.log("   transaction gas cost:", receipt.gasUsed.toNumber())
			console.log("           refunded gas:", -proxyBalanceDelta.div(gasPrice).toNumber())
			console.log("net cost to the relayer:", relayerBalanceDelta.div(gasPrice).toNumber(), "(gas units)")

			expect(relayerBalanceDelta.div(gasPrice).toNumber()).to.lt(1000);

			expect(await sdk.provider.getBalance(dest)).to.be.eq(eth(0.1));
		});

		it('Refund in tokens', async () => {
			const gasToken = tokenContract.address;
			const gasPrice = 1;
			const dest     = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');

			expect(await sdk.provider.getBalance(proxy.address  )).to.be.eq(eth(1.0));
			expect(await sdk.provider.getBalance(dest           )).to.be.eq(eth(0.0));
			expect(await tokenContract.balanceOf(proxy.address  )).to.be.eq(eth(1.0));
			expect(await tokenContract.balanceOf(relayer.address)).to.be.eq(eth(0.0));

			await expect( sdk.multisig.execute(
				proxy,
				[user1],
				{
					to:       dest,
					value:    eth(0.1),
					gasToken,
					gasPrice,
				},
				{ options: { gasLimit: 1000000 } }
			)).to
			// .emit(relayerProxy, 'CallSuccess').withArgs(proxy.address);
			.emit(proxy, 'CallSuccess').withArgs(dest);

			const proxyBalanceDelta   = (await tokenContract.balanceOf(proxy.address)).sub(eth(1.0));
			const relayerBalanceDelta = (await tokenContract.balanceOf(relayer.address)).sub(eth(0.0));
			expect(proxyBalanceDelta.add(relayerBalanceDelta)).to.be.eq(0);

			console.log("gas refunded:", relayerBalanceDelta.div(gasPrice).toNumber());

			expect(await sdk.provider.getBalance(proxy.address  )).to.be.eq(eth(0.9));
			expect(await sdk.provider.getBalance(dest           )).to.be.eq(eth(0.1));
			expect(await tokenContract.balanceOf(proxy.address  )).to.be.eq(eth(1.0).sub(relayerBalanceDelta));
			expect(await tokenContract.balanceOf(relayer.address)).to.be.eq(eth(0.0).add(relayerBalanceDelta));
		});

	});
}

module.exports = testRefund;
