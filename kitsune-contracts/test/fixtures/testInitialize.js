const chai   = require('chai');
const ethers = require('ethers');
const { solidity } = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);

function testInitialize(sdk, name)
{
	describe('Initialize', async () => {
		const [ wallet, relayer, user1, user2, user3 ] = sdk.provider.getWallets();

		it('Verify proxy initialization', async () => {
			expect(await proxy.owner()).to.be.eq(proxy.address);
			expect(await proxy.implementation()).to.be.eq((await sdk.contracts.getActiveInstance(name)).address);
			expect(await proxy.getManagementThreshold()).to.be.eq(1);
			expect(await proxy.getActionThreshold()).to.be.eq(1);
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
			)).to.be.reverted;
			// )).to.be.revertedWith('already-initialized'); // TODO: check error message
		});
	});
}

module.exports = testInitialize;
