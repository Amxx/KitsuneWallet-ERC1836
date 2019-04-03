const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');
const {sendMetaTx} = require('../utils.js')

const {expect} = chai;
chai.use(solidity);

function testExecute(provider, executeabi, extra = [])
{
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

	describe('Execute', async () => {
		it('authorized - pay with proxy', async () => {
			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(1000);
			expect(await provider.getBalance(dest                 )).to.eq(   0);

			await expect(sendMetaTx(
				proxyAsWallet,
				[
					0,    // type
					dest, // to
					500,  // value
					[],   // data
					1,    // nonce
					...extra
				],
				[ user1 ],
				relayer,
				executeabi
			)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);

			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(500);
			expect(await provider.getBalance(dest                 )).to.eq(500);
		});

		it('authorized - call with proxy', async () => {
			randomdata = ethers.utils.hexlify(ethers.utils.randomBytes(32));

			await expect(sendMetaTx(
				proxyAsWallet,
				[
					0,                                                              // type
					targetContract.address,                                         // to
					0,                                                              // value
					targetContract.interface.functions.call.encode([ randomdata ]), // data
					1,                                                              // nonce
					...extra
				],
				[ user1 ],
				relayer,
				executeabi
			)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(targetContract.address);

			expect(await targetContract.lastSender()).to.eq(proxyAsWallet.address);
			expect(await targetContract.lastData()).to.eq(randomdata);
		});

		it('protected', async () => {
			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(1000);

			await expect(proxyAsWallet.connect(user1).execute(
				0,
				user1.address,
				500,
				[],
				{ gasLimit: 80000 }
			)).to.be.revertedWith('access-forbidden');

			expect(await provider.getBalance(proxyAsWallet.address)).to.eq(1000);
		});
	});
}

module.exports = testExecute;
