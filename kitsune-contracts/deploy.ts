import { ethers }                                  from 'ethers';
import { SDK }                                     from '@kitsune-wallet/sdk/dist/sdk';
import { createMockProvider, getWallets, solidity} from 'ethereum-waffle';
import fs                                          from 'fs';
import WaffleConfig                                from './waffle.json';

ethers.errors.setLogLevel('error');

import ActiveAdresses from '@kitsune-wallet/contracts/deployments/active.json';
import GenericFactory from '@kitsune-wallet/contracts/build/GenericFactory.json';
const FACTORY_ADDRESS = "0xFaC100450Af66d838250EA25a389D8Cd09062629";

function updateJSONFile(path, object)
{
	return new Promise((resolve, reject) => {
		new Promise((resolve, reject) => {
			fs.readFile(path, (err, data) => {
				try { resolve(JSON.parse(data.toString())); } catch { resolve({}); }
			});
		})
		.then(content => {
			const data = JSON.stringify({ ...content, ...object }, null, '\t');
			fs.writeFile(path, data, (err) => {
				if (!err) { resolve(); } else { reject(err); }
			});
		});
	});
}

const chain    = process.argv[2] || "kovan";
const provider = ethers.getDefaultProvider(chain);
const wallet   = new ethers.Wallet(process.env.MNEMONIC, provider);
const factory  = new ethers.Contract(ethers.utils.hexlify(FACTORY_ADDRESS), GenericFactory.abi, wallet);

(async () => {

	const sdk      = new SDK(provider, wallet);
	const chainId  = (await provider.getNetwork()).chainId;
	const deployed = {};
	const options  =
	{
		solc:    WaffleConfig.solcVersion,
		options: WaffleConfig.compilerOptions,
		git:     process.env.GIT,
	}

	for (let master of [
		"WalletOwnable",
		"WalletMultisig",
		"WalletMultisigRefund",
		"WalletMultisigRefundOutOfOrder",
		"WalletMultisigRecovery"
	])
	{
		const hash    = ethers.utils.keccak256(`0x${sdk.ABIS[master].bytecode}`);
		const address = await factory.predictAddress(`0x${sdk.ABIS[master].bytecode}`, ethers.constants.HashZero);
		const code    = await provider.getCode(address);
		if (code === '0x')
		{
			process.stdout.write(`Deploying ${master} to expected address ${address} (chain ${chainId}) ... `);
			if (!process.env.DRYRUN)
			{
				const tx = await factory.createContract(`0x${sdk.ABIS[master].bytecode}`, ethers.constants.HashZero);
				await tx.wait();
				process.stdout.write(`done\n`);
			}
			else
			{
				process.stdout.write(`skipped (dryrun)\n`);
			}
		}
		else
		{
			process.stdout.write(`${master} is already deployed at ${address} (chain: ${chainId})\n`);
		}
		deployed[master] = { address, hash, ...options };
	}
	if (!process.env.DRYRUN)
	{
		const path = `deployments/active.json`;
		await updateJSONFile(path, { [chainId]: deployed });
		process.stdout.write(`==> Content written to ${path}\n`)
	}
})();
