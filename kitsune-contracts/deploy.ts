import { ethers }  from 'ethers';
import { SDK }     from '@kitsune-wallet/sdk/dist/sdk';
import { createMockProvider, getWallets, solidity} from 'ethereum-waffle';
import fs from 'fs';

ethers.errors.setLogLevel('error');

import ActiveAdresses from '@kitsune-wallet/contracts/deployments/active.json';
import WaffleConfig   from './waffle.json';


const chain    = process.argv[2] || "kovan";
const provider = ethers.getDefaultProvider(chain);
const wallet   = new ethers.Wallet(process.env.MNEMONIC, provider);

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
		const hash = ethers.utils.keccak256(`0x${sdk.ABIS[master].bytecode}`);
		const deployedMaster = (ActiveAdresses[chainId] || {})[master] || {};

		if (deployedMaster.hash == hash)
		{
			deployed[master] = { ...deployedMaster, hash, ...options };
			console.log(`${master} is already deployed at ${deployed[master].address}`);
		}
		else
		{
			if (!process.env.DRYRUN)
			{
				const address = (await sdk.contracts.deployContract(master, [])).address;
				deployed[master] = { address, hash, ...options };
				console.log(`${master} has been deployed to ${deployed[master].address} (chain ${chainId}, hash ${hash})`);
			}
			else
			{
				console.log(`[DRYRUN] current version ${master} is not deployed in chain ${chainId}.`)
			}
		}
	}
	if (!process.env.DRYRUN)
	{
		const path    = `deployments/pending.${options.git}.json`;
		const content = JSON.stringify({chainId: deployed}, null, '\t') + '\n';
		await fs.promises.writeFile(path, content, { encoding: 'utf-8', flag: 'a' })
		console.log(`content written to ${path}`)
	}
})();
