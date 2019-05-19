import { ethers }  from 'ethers';
import * as crypto from 'crypto';
import * as fs     from 'fs';
import { SDK }     from '@kitsune-wallet/sdk/dist/sdk';
import { createMockProvider, getWallets, solidity} from 'ethereum-waffle';

ethers.errors.setLogLevel('error');

import ActiveAdresses from '@kitsune-wallet/contracts/deployments/active.json';
import WaffleConfig   from '../waffle.json';

// const provider = ethers.getDefaultProvider('ropsten'); // 3
const provider = ethers.getDefaultProvider('goerli'); // 5
// const provider = ethers.getDefaultProvider('kovan'); // 42
const wallet   = new ethers.Wallet(process.env.MNEMONIC, provider);


(async () => {

	fs.readFile('./flattened.sol', async (err, data) => {

		const sdk      = new SDK(provider, wallet);
		const chainId  = (await provider.getNetwork()).chainId;
		const deployed = {};
		// hash flattened source code
		const hash = crypto
			.createHash('sha1')
			.update(data.toString(), 'utf8')
			.digest('hex');
		// compilation options
		const options =
		{
			hash:    hash,
			solc:    WaffleConfig.solcVersion,
			options: WaffleConfig.compilerOptions,
		}

		console.log(`-------------------------------------------------`);
		console.log(`Chainid: ${chainId}`);
		console.log(`Source:  ${hash}`);
		console.log(`-------------------------------------------------`);

		for (let master of [ "WalletOwnable", "WalletMultisig", "WalletMultisigRefund", "WalletMultisigRefundOutOfOrder" ])
		{
			const deployedMaster = (ActiveAdresses[chainId] || {})[master] || {};

			if (JSON.stringify({ hash: deployedMaster.hash, solc: deployedMaster.solc, options: deployedMaster.options }) == JSON.stringify(options))
			{
				deployed[master] = deployedMaster;
				console.log(`${master} is already deployed at ${deployed[master].address}`);
			}
			else
			{
				const address = (await sdk.contracts.deployContract(master, [])).address;
				deployed[master] = { address, ...options };
				console.log(`${master} has been deployed to ${deployed[master].address} (chain ${chainId})`);
			}
		}
		console.log(JSON.stringify(deployed, null, '\t'));
	});

})();
