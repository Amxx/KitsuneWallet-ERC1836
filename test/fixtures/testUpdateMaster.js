const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');
const {relayMetaTx,prepareMetaTx} = require('../../utils/utils.js');

const {expect} = chai;
chai.use(solidity);

function testUpdateMaster(provider, executeabi)
{
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

	describe('UpdateMaster', async () => {

		it('authorized', async () => {
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.nonce()).to.be.eq(0);

			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: proxyAsWallet.address,
						data: proxyAsWallet.interface.functions.updateMaster.encode([
							walletContract.address,
							walletContract.interface.functions.initialize.encode([
								[ ethers.utils.keccak256(user2.address) ],
								[ "0x0000000000000000000000000000000000000000000000000000000000000007" ],
								1,
								1,
							]),
							true,
						]),
						nonce: 1,
					},
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to
			.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
			.emit(proxyAsWallet, 'MasterChange').withArgs(walletContract.address, walletContract.address);


			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getKey(ethers.utils.keccak256(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.nonce()).to.be.eq(1);
		});

		it('protected', async () => {
			await expect(proxyAsWallet.connect(user2).execute(
				0,
				proxyAsWallet.address,
				0,
				proxyAsWallet.interface.functions.updateMaster.encode([
					walletContract.address,
					walletContract.interface.functions.initialize.encode([
						[ ethers.utils.keccak256(user2.address) ],
						[ "0x000000000000000000000000000000000000000000000000000000000000000f" ],
						1,
						1,
					]),
					true,
				]),
				{ gasLimit: 800000 }
			)).to.be.revertedWith('access-forbidden');
		});
	});
}

module.exports = testUpdateMaster;
