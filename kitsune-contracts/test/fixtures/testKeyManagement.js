const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);

function testKeyManagement(sdk)
{
	describe('Key Management', async () => {

		const [ wallet, relayer, user1, user2, user3 ] = getWallets(sdk.provider);
		const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

		it('getKey', async () => {
			expect(await proxy.functions['getKey(bytes32)'](sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.functions['getKey(bytes32)'](sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.functions['getKey(address)'](                    user1.address )).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.functions['getKey(address)'](                    user2.address )).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
		});

		it('keyHasPurpose', async () => {
			expect(await proxy.functions['keyHasPurpose(bytes32,bytes32)'](sdk.utils.addrToKey(user1.address), '0x0000000000000000000000000000000000000000000000000000000000000001')).to.be.eq(true);
			expect(await proxy.functions['keyHasPurpose(bytes32,bytes32)'](sdk.utils.addrToKey(user1.address), '0x0000000000000000000000000000000000000000000000000000000000000002')).to.be.eq(true);
			expect(await proxy.functions['keyHasPurpose(bytes32,bytes32)'](sdk.utils.addrToKey(user1.address), '0x0000000000000000000000000000000000000000000000000000000000000004')).to.be.eq(true);
			expect(await proxy.functions['keyHasPurpose(bytes32,bytes32)'](sdk.utils.addrToKey(user1.address), '0x0000000000000000000000000000000000000000000000000000000000000008')).to.be.eq(false);
			expect(await proxy.functions['keyHasPurpose(bytes32,bytes32)'](sdk.utils.addrToKey(user1.address), '0x0000000000000000000000000000000000000000000000000000000000000007')).to.be.eq(true);
			expect(await proxy.functions['keyHasPurpose(bytes32,bytes32)'](sdk.utils.addrToKey(user1.address), '0x0000000000000000000000000000000000000000000000000000000000000009')).to.be.eq(false);
			expect(await proxy.functions['keyHasPurpose(address,bytes32)'](                    user1.address , '0x0000000000000000000000000000000000000000000000000000000000000001')).to.be.eq(true);
			expect(await proxy.functions['keyHasPurpose(address,bytes32)'](                    user1.address , '0x0000000000000000000000000000000000000000000000000000000000000002')).to.be.eq(true);
			expect(await proxy.functions['keyHasPurpose(address,bytes32)'](                    user1.address , '0x0000000000000000000000000000000000000000000000000000000000000004')).to.be.eq(true);
			expect(await proxy.functions['keyHasPurpose(address,bytes32)'](                    user1.address , '0x0000000000000000000000000000000000000000000000000000000000000008')).to.be.eq(false);
			expect(await proxy.functions['keyHasPurpose(address,bytes32)'](                    user1.address , '0x0000000000000000000000000000000000000000000000000000000000000007')).to.be.eq(true);
			expect(await proxy.functions['keyHasPurpose(address,bytes32)'](                    user1.address , '0x0000000000000000000000000000000000000000000000000000000000000009')).to.be.eq(false);
		});

		it('AddKey', async () => {
			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.getActiveKeys()).to.deep.eq([sdk.utils.addrToKey(user1.address)]);
			expect(await proxy.getManagementKeyCount()).to.be.eq(1);

			await expect(sdk.multisig.setKey(
				proxy,
				[ user1 ],
				sdk.utils.addrToKey(user2.address),
				'0x0000000000000000000000000000000000000000000000000000000000000004',
				{ options: { gasLimit: 1000000 } }
			)).to
			.emit(proxy, 'CallSuccess').withArgs(proxy.address)
			.emit(proxy, 'SetKey').withArgs(sdk.utils.addrToKey(user2.address), "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000004");

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000004');
			expect(await proxy.getActiveKeys()).to.deep.eq([sdk.utils.addrToKey(user1.address),sdk.utils.addrToKey(user2.address)]);
			expect(await proxy.getManagementKeyCount()).to.be.eq(1);
		});

		it('UpdateKey', async () => {
			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.getActiveKeys()).to.deep.eq([sdk.utils.addrToKey(user1.address)]);
			expect(await proxy.getManagementKeyCount()).to.be.eq(1);

			await expect(sdk.multisig.setKey(
				proxy,
				[ user1 ],
				sdk.utils.addrToKey(user1.address),
				'0x000000000000000000000000000000000000000000000000000000000000000f',
				{ options: { gasLimit: 1000000 } }
			)).to
			.emit(proxy, 'CallSuccess').withArgs(proxy.address)
			.emit(proxy, 'SetKey').withArgs(sdk.utils.addrToKey(user1.address), "0x0000000000000000000000000000000000000000000000000000000000000007", "0x000000000000000000000000000000000000000000000000000000000000000f");

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x000000000000000000000000000000000000000000000000000000000000000f');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.getActiveKeys()).to.deep.eq([sdk.utils.addrToKey(user1.address)]);
			expect(await proxy.getManagementKeyCount()).to.be.eq(1);
		});

		it('Cannot remove last management key', async () => {
			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.getActiveKeys()).to.deep.eq([sdk.utils.addrToKey(user1.address)]);
			expect(await proxy.getManagementKeyCount()).to.be.eq(1);

			await expect(sdk.multisig.setKey(
				proxy,
				[ user1 ],
				sdk.utils.addrToKey(user1.address),
				'0x0000000000000000000000000000000000000000000000000000000000000006',
				{ options: { gasLimit: 1000000 } }
			)).to.emit(proxy, 'CallFailure'); //.withArgs(proxy.address, 'cannot-remove-critical-management-key');

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.getActiveKeys()).to.deep.eq([sdk.utils.addrToKey(user1.address)]);
			expect(await proxy.getManagementKeyCount()).to.be.eq(1);
		});

		it('Add then Remove', async () => {

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.getActiveKeys()).to.deep.eq([sdk.utils.addrToKey(user1.address)]);
			expect(await proxy.getManagementKeyCount()).to.be.eq(1);

			await expect(sdk.multisig.setKey(
				proxy,
				[ user1 ],
				sdk.utils.addrToKey(user2.address),
				'0x0000000000000000000000000000000000000000000000000000000000000007',
				{ options: { gasLimit: 1000000 } }
			)).to
			.emit(proxy, 'CallSuccess').withArgs(proxy.address)
			.emit(proxy, 'SetKey').withArgs(sdk.utils.addrToKey(user2.address), "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000007");

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getActiveKeys()).to.deep.eq([sdk.utils.addrToKey(user1.address),sdk.utils.addrToKey(user2.address)]);
			expect(await proxy.getManagementKeyCount()).to.be.eq(2);

			await expect(sdk.multisig.setKey(
				proxy,
				[ user1 ],
				sdk.utils.addrToKey(user1.address),
				'0x0000000000000000000000000000000000000000000000000000000000000000',
				{ options: { gasLimit: 1000000 } }
			)).to
			.emit(proxy, 'CallSuccess').withArgs(proxy.address)
			.emit(proxy, 'SetKey').withArgs(sdk.utils.addrToKey(user1.address), "0x0000000000000000000000000000000000000000000000000000000000000007", "0x0000000000000000000000000000000000000000000000000000000000000000");

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getActiveKeys()).to.deep.eq([sdk.utils.addrToKey(user2.address)]);
			expect(await proxy.getManagementKeyCount()).to.be.eq(1);
		});
	});
}

module.exports = testKeyManagement;
