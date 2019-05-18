import { ethers }  from 'ethers';
import * as crypto from 'crypto';
import * as fs     from 'fs';
import { SDK }     from '@kitsune-wallet/sdk/dist/sdk';
import { createMockProvider, getWallets, solidity} from 'ethereum-waffle';

ethers.errors.setLogLevel('error');

import ActiveAdresses from '@kitsune-wallet/contracts/deployments/active.json';
import WaffleConfig   from '../waffle.json';


const provider = ethers.getDefaultProvider('kovan');
const wallet   = new ethers.Wallet(process.env.MNEMONIC, provider);


(async () => {
	const sdk      = new SDK(provider, wallet);
	const chainId  = (await provider.getNetwork()).chainId;

	fs.readFile('./flattened.sol', async (err, data) => {

		const deployments = {};

		const hash = crypto
			.createHash('sha1')
			.update(data.toString(), 'utf8')
			.digest('hex');

		for (let master of [ "WalletOwnable", "WalletMultisig", "WalletMultisigRefund", "WalletMultisigRefundOutOfOrder" ])
		{
			var address = null;
			if (                ActiveAdresses[chainId]                 !== undefined
				&&                ActiveAdresses[chainId][master]         !== undefined
				&&                ActiveAdresses[chainId][master].hash     == hash
				&& JSON.stringify(ActiveAdresses[chainId][master].solc   ) == JSON.stringify(WaffleConfig.solcVersion)
				&& JSON.stringify(ActiveAdresses[chainId][master].options) == JSON.stringify(WaffleConfig.compilerOptions)
			)
			{
				address = ActiveAdresses[chainId][master].address;
				console.log(`${master} is already deployed at ${ActiveAdresses[chainId][master].address}`);
			}
			else
			{
				address = (await sdk.contracts.deployContract(master, [])).address;
				console.log(`${master} has been deployed to ${ActiveAdresses[chainId][master].address} (chain ${chainId})`);
			}
			deployments[master] = {
				address: address,
				hash:    hash,
				solc:    WaffleConfig.solcVersion,
				options: WaffleConfig.compilerOptions,
			}
		}
		console.log(JSON.stringify(deployments, null, '\t'));
	});

})();
