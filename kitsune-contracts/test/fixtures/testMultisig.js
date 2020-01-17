const chai   = require('chai');
const ethers = require('ethers');
const { solidity } = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);

function testMultisig(sdk)
{
	describe('Multisig', async () => {
		const [ wallet, relayer, user1, user2, user3 ] = sdk.provider.getWallets();
		const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

		describe('Nonce', async () => {
			it('valid', async () => {
				expect(await proxy.nonce()).to.be.eq(0);

				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{ to: dest, nonce: 1 },
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallSuccess').withArgs(dest);

				expect(await proxy.nonce()).to.be.eq(1);
			});

			it('invalid', async () => {
				expect(await proxy.nonce()).to.be.eq(0);

				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{ to: dest, nonce: 2 },
					{ options: { gasLimit: 1000000 } },
				)).to.be.revertedWith('invalid-nonce');

				expect(await proxy.nonce()).to.be.eq(0);
			});

			it('replay protection', async () => {
				expect(await proxy.nonce()).to.be.eq(0);

				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{ to: dest, nonce: 1 },
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallSuccess').withArgs(dest);

				expect(await proxy.nonce()).to.be.eq(1);

				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{ to: dest, nonce: 1 },
					{ options: { gasLimit: 1000000 } },
				)).to.be.revertedWith('invalid-nonce');

				expect(await proxy.nonce()).to.be.eq(1);
			});
		});

		describe('Change management threshold', async () => {
			it('valid', async () => {
				expect(await proxy.getManagementThreshold()).to.be.eq(1);

				await expect(sdk.multisig.setKey(
					proxy,
					[ user1 ],
					sdk.utils.addrToKey(user2.address),
					'0x0000000000000000000000000000000000000000000000000000000000000001',
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallSuccess').withArgs(proxy.address);
				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{
						to: proxy.address,
						data: proxy.interface.functions.setManagementThreshold.encode([2]),
					},
					{ options: { gasLimit: 1000000 } },
				)).to
				.emit(proxy, 'CallSuccess').withArgs(proxy.address)
				.emit(proxy, 'ManagementThresholdChange').withArgs(1, 2);

				expect(await proxy.getManagementThreshold()).to.be.eq(2);
			});

			it('invalid (too low)', async () => {
				expect(await proxy.getManagementThreshold()).to.be.eq(1);

				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{
						to: proxy.address,
						data: proxy.interface.functions.setManagementThreshold.encode([0]),
					},
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallFailure'); //.withArgs(proxy.address, 'threshold-too-low');

				expect(await proxy.getManagementThreshold()).to.be.eq(1);
			});

			it('invalid (too high)', async () => {
				expect(await proxy.getManagementThreshold()).to.be.eq(1);

				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{
						to: proxy.address,
						data: proxy.interface.functions.setManagementThreshold.encode([2]),
					},
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallFailure'); //.withArgs(proxy.address, 'threshold-too-high');

				expect(await proxy.getManagementThreshold()).to.be.eq(1);
			});
		});

		describe('Manage with multiple signatures', async () => {
			it('valid', async () => {
				expect(await proxy.getManagementThreshold()).to.be.eq(1);

				await expect(sdk.multisig.setKey(
					proxy,
					[ user1 ],
					sdk.utils.addrToKey(user2.address),
					'0x0000000000000000000000000000000000000000000000000000000000000001',
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallSuccess').withArgs(proxy.address);

				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{
						to: proxy.address,
						data: proxy.interface.functions.setManagementThreshold.encode([2]),
					},
					{ options: { gasLimit: 1000000 } },
				)).to
				.emit(proxy, 'CallSuccess').withArgs(proxy.address)
				.emit(proxy, 'ManagementThresholdChange').withArgs(1, 2);

				await expect(sdk.multisig.execute(
					proxy,
					[ user1, user2 ],
					{
						to: proxy.address,
						data: proxy.interface.functions.setManagementThreshold.encode([1]),
					},
					{ options: { gasLimit: 1000000 } },
				)).to
				.emit(proxy, 'CallSuccess').withArgs(proxy.address)
				.emit(proxy, 'ManagementThresholdChange').withArgs(2, 1);

				expect(await proxy.getManagementThreshold()).to.be.eq(1);
			});

			it('invalid', async () => {
				expect(await proxy.getManagementThreshold()).to.be.eq(1);

				await expect(sdk.multisig.setKey(
					proxy,
					[ user1 ],
					sdk.utils.addrToKey(user2.address),
					'0x0000000000000000000000000000000000000000000000000000000000000001',
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallSuccess').withArgs(proxy.address);

				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{
						to: proxy.address,
						data: proxy.interface.functions.setManagementThreshold.encode([2]),
					},
					{ options: { gasLimit: 1000000 } },
				)).to
				.emit(proxy, 'CallSuccess').withArgs(proxy.address)
				.emit(proxy, 'ManagementThresholdChange').withArgs(1, 2);

				await expect(sdk.multisig.execute(
					proxy,
					[ user2 ],
					{
						to: proxy.address,
						data: proxy.interface.functions.setManagementThreshold.encode([1]),
					},
					{ options: { gasLimit: 1000000 } },
				)).to.be.revertedWith('missing-signers');

				expect(await proxy.getManagementThreshold()).to.be.eq(2);
			});
		});

		describe('Change execution threshold', async () => {
			it('valid', async () => {
				expect(await proxy.getActionThreshold()).to.be.eq(1);

				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{
						to: proxy.address,
						data: proxy.interface.functions.setActionThreshold.encode([2]),
					},
					{ options: { gasLimit: 1000000 } },
				)).to
				.emit(proxy, 'CallSuccess').withArgs(proxy.address)
				.emit(proxy, 'ActionThresholdChange').withArgs(1, 2);

				expect(await proxy.getActionThreshold()).to.be.eq(2);
			});

			it('invalid', async () => {
				expect(await proxy.getActionThreshold()).to.be.eq(1);

				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{
						to: proxy.address,
						data: proxy.interface.functions.setActionThreshold.encode([0]),
					},
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallFailure'); //.withArgs(proxy.address, 'threshold-too-low');

				expect(await proxy.getActionThreshold()).to.be.eq(1);
			});
		});

		describe('Execute with multiple signatures', async () => {
			it('valid', async () => {
				await expect(sdk.multisig.setKey(
					proxy,
					[ user1 ],
					sdk.utils.addrToKey(user2.address),
					'0x0000000000000000000000000000000000000000000000000000000000000006',
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallSuccess').withArgs(proxy.address);
				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{
						to: proxy.address,
						data: proxy.interface.functions.setActionThreshold.encode([2]),
					},
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallSuccess').withArgs(proxy.address);
				await expect(sdk.multisig.execute(
					proxy,
					[ user1, user2 ],
					{
						to: dest,
					},
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallSuccess').withArgs(dest);
				await expect(sdk.multisig.execute(
					proxy,
					[ user2, user1 ],
					{
						to: dest,
					},
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			});

			it('invalid - unauthorized signer', async () => {
				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{
						to: proxy.address,
						data: proxy.interface.functions.setActionThreshold.encode([2]),
					},
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallSuccess').withArgs(proxy.address);
				await expect(sdk.multisig.execute(
					proxy,
					[ user1, user2 ],
					{
						to: dest,
					},
					{ options: { gasLimit: 1000000 } },
				)).to.be.revertedWith('invalid-signature');
			});

			it('invalid - multiple signer', async () => {
				await expect(sdk.multisig.execute(
					proxy,
					[ user1 ],
					{
						to: proxy.address,
						data: proxy.interface.functions.setActionThreshold.encode([2]),
					},
					{ options: { gasLimit: 1000000 } },
				)).to.emit(proxy, 'CallSuccess').withArgs(proxy.address);
				await expect(sdk.multisig.execute(
					proxy,
					[ user1, user1 ],
					{
						to: dest,
					},
					{ options: { gasLimit: 1000000 } },
				)).to.be.revertedWith('invalid-signatures-ordering');
			});
		});
	});
}

module.exports = testMultisig;
