const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);

function testUpdateMaster(sdk, name)
{
	describe('UpdateMaster', async () => {

		const [ wallet, relayer, user1, user2, user3 ] = getWallets(sdk.provider);
		const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));
		const masterAddress = (await sdk.contracts.getMasterInstance(name)).address;

		it('authorized', async () => {
			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.nonce()).to.be.eq(0);

			await expect(sdk.transactions.relay(
				await sdk.transactions.sign(
					proxy,
					{
						to: proxy.address,
						data: sdk.makeUpdateTx(
							[
								masterAddress,
								sdk.makeInitializationTx(
									name,
									[
										[ sdk.utils.addrToKey(user2.address) ],
										[ "0x0000000000000000000000000000000000000000000000000000000000000007" ],
										1,
										1,
									]
								),
								true,
							]
						),
					},
					[ user1 ],
				),
				relayer,
			)).to
			.emit(proxy, 'CallSuccess').withArgs(proxy.address)
			.emit(proxy, 'MasterChange').withArgs(masterAddress, masterAddress);


			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.nonce()).to.be.eq(1);
		});

		it('protected', async () => {
			await expect(proxy.connect(user2).execute(
				0,
				proxy.address,
				0,
				sdk.makeUpdateTx(
					"WalletMultisig",
					[
						walletContract.address,
						sdk.makeInitializationTx(
							"WalletMultisig",
							[
								[ sdk.utils.addrToKey(user2.address) ],
								[ "0x000000000000000000000000000000000000000000000000000000000000000f" ],
								1,
								1,
							]
						),
						true,
					]
				),
				{ gasLimit: 800000 }
			)).to.be.revertedWith('access-forbidden');
		});
	});
}

module.exports = testUpdateMaster;
