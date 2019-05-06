const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);

function testInitialize(sdk, name)
{
	describe('Initialize', async () => {

		const [ wallet, relayer, user1, user2, user3 ] = getWallets(sdk.provider);

		it('Verify proxy initialization', async () => {
			expect(await proxy.owner()).to.eq(proxy.address);
			expect(await proxy.master()).to.eq((await sdk.contracts.getMasterInstance(name)).address);
			expect(await proxy.getManagementThreshold()).to.eq(1);
			expect(await proxy.getActionThreshold()).to.eq(1);
		});

		it('reintrance protection', async () => {
			await expect(proxy.connect(user1).initialize(
				[
					sdk.utils.addrToKey(user1.address),
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
