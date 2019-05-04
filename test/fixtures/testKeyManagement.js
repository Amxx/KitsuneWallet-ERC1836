const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');
const {relayMetaTx,prepareMetaTx} = require('../../utils/utils.js');

const {expect} = chai;
chai.use(solidity);

function testKeyManagement(provider, executeabi, addrToKey = ethers.utils.keccak256)
{
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

	describe('Key Management', async () => {
		it('getKey', async () => {
			expect(await proxyAsWallet.functions['getKey(bytes32)'](addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.functions['getKey(bytes32)'](addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.functions['getKey(address)'](          user1.address )).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.functions['getKey(address)'](          user2.address )).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
		});

		it('keyHasPurpose', async () => {
			expect(await proxyAsWallet.functions['keyHasPurpose(bytes32,bytes32)'](addrToKey(user1.address), '0x0000000000000000000000000000000000000000000000000000000000000001')).to.be.eq(true);
			expect(await proxyAsWallet.functions['keyHasPurpose(bytes32,bytes32)'](addrToKey(user1.address), '0x0000000000000000000000000000000000000000000000000000000000000002')).to.be.eq(true);
			expect(await proxyAsWallet.functions['keyHasPurpose(bytes32,bytes32)'](addrToKey(user1.address), '0x0000000000000000000000000000000000000000000000000000000000000004')).to.be.eq(true);
			expect(await proxyAsWallet.functions['keyHasPurpose(bytes32,bytes32)'](addrToKey(user1.address), '0x0000000000000000000000000000000000000000000000000000000000000008')).to.be.eq(false);
			expect(await proxyAsWallet.functions['keyHasPurpose(bytes32,bytes32)'](addrToKey(user1.address), '0x0000000000000000000000000000000000000000000000000000000000000007')).to.be.eq(true);
			expect(await proxyAsWallet.functions['keyHasPurpose(bytes32,bytes32)'](addrToKey(user1.address), '0x0000000000000000000000000000000000000000000000000000000000000009')).to.be.eq(false);
			expect(await proxyAsWallet.functions['keyHasPurpose(address,bytes32)'](          user1.address , '0x0000000000000000000000000000000000000000000000000000000000000001')).to.be.eq(true);
			expect(await proxyAsWallet.functions['keyHasPurpose(address,bytes32)'](          user1.address , '0x0000000000000000000000000000000000000000000000000000000000000002')).to.be.eq(true);
			expect(await proxyAsWallet.functions['keyHasPurpose(address,bytes32)'](          user1.address , '0x0000000000000000000000000000000000000000000000000000000000000004')).to.be.eq(true);
			expect(await proxyAsWallet.functions['keyHasPurpose(address,bytes32)'](          user1.address , '0x0000000000000000000000000000000000000000000000000000000000000008')).to.be.eq(false);
			expect(await proxyAsWallet.functions['keyHasPurpose(address,bytes32)'](          user1.address , '0x0000000000000000000000000000000000000000000000000000000000000007')).to.be.eq(true);
			expect(await proxyAsWallet.functions['keyHasPurpose(address,bytes32)'](          user1.address , '0x0000000000000000000000000000000000000000000000000000000000000009')).to.be.eq(false);
		});

		it('AddKey', async () => {
			expect(await proxyAsWallet.getKey(addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([addrToKey(user1.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);

			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: proxyAsWallet.address,
						data: proxyAsWallet.interface.functions.setKey.encode([
							addrToKey(user2.address),
							'0x0000000000000000000000000000000000000000000000000000000000000004'
						]),
					},
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to
			.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
			.emit(proxyAsWallet, 'SetKey').withArgs(addrToKey(user2.address), "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000004");

			expect(await proxyAsWallet.getKey(addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000004');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([addrToKey(user1.address),addrToKey(user2.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);
		});

		it('UpdateKey', async () => {
			expect(await proxyAsWallet.getKey(addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([addrToKey(user1.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);

			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: proxyAsWallet.address,
						data: proxyAsWallet.interface.functions.setKey.encode([
							addrToKey(user1.address),
							'0x000000000000000000000000000000000000000000000000000000000000000f',
						]),
					},
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to
			.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
			.emit(proxyAsWallet, 'SetKey').withArgs(addrToKey(user1.address), "0x0000000000000000000000000000000000000000000000000000000000000007", "0x000000000000000000000000000000000000000000000000000000000000000f");

			expect(await proxyAsWallet.getKey(addrToKey(user1.address))).to.be.eq('0x000000000000000000000000000000000000000000000000000000000000000f');
			expect(await proxyAsWallet.getKey(addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([addrToKey(user1.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);
		});

		it('Cannot remove last management key', async () => {
			expect(await proxyAsWallet.getKey(addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([addrToKey(user1.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);

			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: proxyAsWallet.address,
						data: proxyAsWallet.interface.functions.setKey.encode([
							addrToKey(user1.address),
							'0x0000000000000000000000000000000000000000000000000000000000000006',
						]),
					},
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to.emit(proxyAsWallet, 'CallFailure'); //.withArgs(proxyAsWallet.address, 'cannot-remove-critical-management-key');

			expect(await proxyAsWallet.getKey(addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([addrToKey(user1.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);
		});

		it('Add then Remove', async () => {

			expect(await proxyAsWallet.getKey(addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([addrToKey(user1.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);

			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: proxyAsWallet.address,
						data: proxyAsWallet.interface.functions.setKey.encode([
							addrToKey(user2.address),
							'0x0000000000000000000000000000000000000000000000000000000000000007',
						]),
					},
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to
			.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
			.emit(proxyAsWallet, 'SetKey').withArgs(addrToKey(user2.address), "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000007");


			expect(await proxyAsWallet.getKey(addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getKey(addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([addrToKey(user1.address),addrToKey(user2.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(2);

			await expect(relayMetaTx(
				await prepareMetaTx(
					proxyAsWallet,
					{
						to: proxyAsWallet.address,
						data: proxyAsWallet.interface.functions.setKey.encode([
							addrToKey(user1.address),
							'0x0000000000000000000000000000000000000000000000000000000000000000',
						]),
					},
					[ user1 ],
					executeabi,
				),
				relayer,
			)).to
			.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
			.emit(proxyAsWallet, 'SetKey').withArgs(addrToKey(user1.address), "0x0000000000000000000000000000000000000000000000000000000000000007", "0x0000000000000000000000000000000000000000000000000000000000000000");

			expect(await proxyAsWallet.getKey(addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxyAsWallet.getKey(addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxyAsWallet.getActiveKeys()).to.deep.eq([addrToKey(user2.address)]);
			expect(await proxyAsWallet.managementKeyCount()).to.be.eq(1);
		});
	});
}

module.exports = testKeyManagement;
