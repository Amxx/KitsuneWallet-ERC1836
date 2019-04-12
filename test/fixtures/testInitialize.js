const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');
const {relayMetaTx,prepareMetaTx} = require('../../utils/utils.js');

const {expect} = chai;
chai.use(solidity);

function testInitialize(provider, executeabi, extra = [])
{
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);

	describe('Initialize', async () => {

		it('Verify proxy initialization', async () => {
			expect(await proxyAsWallet.owner()).to.eq(proxyAsWallet.address);
			expect(await proxyAsWallet.master()).to.eq(walletContract.address);
			expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);
			expect(await proxyAsWallet.getActionThreshold()).to.eq(1);
		});

		it('reintrance protection', async () => {
			await expect(proxyAsWallet.connect(user1).initialize(
				[
					ethers.utils.keccak256(user1.address),
				],
				[
					'0x0000000000000000000000000000000000000000000000000000000000000007',
				],
				1,
				1,
			)).to.be.revertedWith('already-initialized');
		});
	});
}

module.exports = testInitialize;
