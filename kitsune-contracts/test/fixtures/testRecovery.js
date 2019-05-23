const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);

function testRecovery(sdk, name)
{
	describe('testRecovery', async () => {
		const [ wallet, relayer, user1, user2, user3 ] = getWallets(sdk.provider);
		const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));


		it('lastUsage', async () => {
			const timeBefore = await proxy.recoveryLastUsage();

			await sdk.provider.send("evm_increaseTime", 10);

			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{ to: dest, },
				{ options: { gasLimit: 1000000 } }
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);

			const timeAfter = await proxy.recoveryLastUsage();

			expect(timeAfter - timeBefore).to.be.least(10); // could be 10 or 11
		});

		it ('authorized', async () => {
			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');

			const recoveryCode = ethers.utils.randomBytes(32);
			const recoveryhash = ethers.utils.keccak256(recoveryCode);

			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{
					to: proxy.address,
					data: proxy.interface.functions.setRecoveryHash.encode([ recoveryhash ]),
				},
				{ options: { gasLimit: 1000000 } }
			)).to.emit(proxy, 'CallSuccess').withArgs(proxy.address);

			await sdk.provider.send("evm_increaseTime", (await proxy.recoveryTimer()).toNumber());

			const tx = proxy.connect(user2).recovery(
				recoveryCode,
				(await sdk.contracts.getActiveInstance(name)).address,
				sdk.transactions.initialization(
					name,
					[
						[ sdk.utils.addrToKey(user2.address) ],
						[ "0x0000000000000000000000000000000000000000000000000000000000000007" ],
						1,
						1,
					]
				),
				{ gasLimit: 1000000 }
			);

			await (await tx).wait();

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
		});

		it ('revert - invalid recovery key', async () => {
			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');

			const recoveryCode = ethers.utils.randomBytes(32);
			const recoveryhash = ethers.utils.keccak256(recoveryCode);

			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{
					to: proxy.address,
					data: proxy.interface.functions.setRecoveryHash.encode([ recoveryhash ]),
				},
				{ options: { gasLimit: 1000000 } }
			)).to.emit(proxy, 'CallSuccess').withArgs(proxy.address);

			await sdk.provider.send("evm_increaseTime", (await proxy.recoveryTimer()).toNumber());

			expect(proxy.connect(user2).recovery(
				ethers.constants.HashZero,
				(await sdk.contracts.getActiveInstance(name)).address,
				sdk.transactions.initialization(
					name,
					[
						[ sdk.utils.addrToKey(user2.address) ],
						[ "0x0000000000000000000000000000000000000000000000000000000000000007" ],
						1,
						1,
					]
				),
				{ gasLimit: 1000000 }
			)).to.be.revertedWith("invalid-recovery-key");

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
		});

		it ('revert - invalid recovery timmer', async () => {
			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');

			const recoveryCode = ethers.utils.randomBytes(32);
			const recoveryhash = ethers.utils.keccak256(recoveryCode);

			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{
					to: proxy.address,
					data: proxy.interface.functions.setRecoveryHash.encode([ recoveryhash ]),
				},
				{ options: { gasLimit: 1000000 } }
			)).to.emit(proxy, 'CallSuccess').withArgs(proxy.address);

			expect(proxy.connect(user2).recovery(
				recoveryCode,
				(await sdk.contracts.getActiveInstance(name)).address,
				sdk.transactions.initialization(
					name,
					[
						[ sdk.utils.addrToKey(user2.address) ],
						[ "0x0000000000000000000000000000000000000000000000000000000000000007" ],
						1,
						1,
					]
				),
				{ gasLimit: 1000000 }
			)).to.be.revertedWith("invalid-recovery-timmer");

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
		});

	});
}

module.exports = testRecovery;
