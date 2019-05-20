import { ethers }  from 'ethers';
import { SDK }     from '@kitsune-wallet/sdk/dist/sdk';
import { createMockProvider, getWallets, solidity} from 'ethereum-waffle';

ethers.errors.setLogLevel('error');

import ActiveAdresses from '@kitsune-wallet/contracts/deployments/active.json';
import WaffleConfig   from './waffle.json';

// const provider = ethers.getDefaultProvider('ropsten'); // 3
// const provider = ethers.getDefaultProvider('goerli');  // 5
const provider = ethers.getDefaultProvider('kovan');   // 42
const wallet   = new ethers.Wallet(process.env.MNEMONIC, provider);


(async () => {

	const sdk      = new SDK(provider, wallet);
	const chainId  = (await provider.getNetwork()).chainId;
	const deployed = {};

	for (let master of [ "WalletOwnable", "WalletMultisig", "WalletMultisigRefund", "WalletMultisigRefundOutOfOrder" ])
	{
		// compilation options
		const options =
		{
			hash:    ethers.utils.keccak256(`0x${sdk.ABIS[master].bytecode}`),
			solc:    WaffleConfig.solcVersion,
			options: WaffleConfig.compilerOptions,
		}

		// console.log(`-------------------------------------------------`);
		// console.log(`Master:  ${master}`);
		// console.log(`Chainid: ${chainId}`);
		// console.log(`Source:  ${options.hash}`);
		// console.log(`-------------------------------------------------`);

		const deployedMaster = (ActiveAdresses[chainId] || {})[master] || {};

		if (deployedMaster.hash == options.hash)
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

})();
