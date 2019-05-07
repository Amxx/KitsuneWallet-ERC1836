import { ethers } from 'ethers';
import { SDK }    from '../src/SDK';

import { createMockProvider, getWallets, solidity} from 'ethereum-waffle';

ethers.errors.setLogLevel('error');

(async () => {

	const provider = createMockProvider();
	const [ wallet ] = getWallets(provider);

	// const provider = new ethers.providers.EtherscanProvider('kovan');
	// const wallet   = new ethers.Wallet("0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407", provider);

	var sdk  = new SDK(provider, wallet)

	var proxy = await sdk.contracts.deployProxy(
		"WalletOwnable",
		[ wallet.address ],
		{ "allowDeploy":true }
	);
	console.log(`proxy    : ${proxy.address}`         );
	console.log(`master   : ${await proxy.master()}`  );
	console.log(`masterId : ${await proxy.masterId()}`);
	console.log(`owner    : ${await proxy.owner()}`   );
	console.log("");

	proxy = await sdk.contracts.upgradeProxy(
		proxy,
		"WalletMultisig",
		[
			[ sdk.utils.addrToKey(wallet.address) ],
			[ "0x0000000000000000000000000000000000000000000000000000000000000001" ],
			1,
			1,
		],
		sdk.execute.ownable.bind(sdk.execute, wallet),
		{ allowDeploy: true }
	);

	console.log(`proxy      : ${proxy.address}`         );
	console.log(`master     : ${await proxy.master()}`  );
	console.log(`masterId   : ${await proxy.masterId()}`);
	console.log(`owner      : ${await proxy.owner()}`   );
	console.log(`getKey(U1) : ${await proxy.functions['getKey(address)'](wallet.address)}`);
	console.log("");


	proxy = await sdk.contracts.upgradeProxy(
		proxy,
		"WalletMultisigRefund",
		null,
		sdk.execute.multisig.bind(sdk.execute, [ wallet ]),
		{ allowDeploy: true }
	);

	console.log(`proxy      : ${proxy.address}`         );
	console.log(`master     : ${await proxy.master()}`  );
	console.log(`masterId   : ${await proxy.masterId()}`);
	console.log(`owner      : ${await proxy.owner()}`   );
	console.log(`getKey(U1) : ${await proxy.functions['getKey(address)'](wallet.address)}`);
	console.log("");

})();
