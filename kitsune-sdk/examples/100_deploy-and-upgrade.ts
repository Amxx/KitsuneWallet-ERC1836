import { ethers } from 'ethers';
import { SDK }    from '../dist/sdk';
import { MockProvider, solidity } from 'ethereum-waffle';

ethers.errors.setLogLevel('error');

(async () => {

	const provider = new MockProvider();
	const [ wallet ] = provider.getWallets();

	var sdk = new SDK(provider, wallet)

	var proxy = await sdk.contracts.deployProxy(
		"WalletOwnable",
		[ wallet.address ],
		{ deploy: { enable: true } }
	);
	console.log(`proxy          : ${proxy.address}`               );
	console.log(`implementation : ${await proxy.implementation()}`);
	console.log(`owner          : ${await proxy.owner()}`         );
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
		(proxy, tx, config) => wallet.sendTransaction({ ...tx, ...config.options }),
		{ deploy: { enable: true }, options: { gasLimit: 1000000 } }
	);

	console.log(`proxy          : ${proxy.address}`               );
	console.log(`implementation : ${await proxy.implementation()}`);
	console.log(`owner          : ${await proxy.owner()}`         );
	console.log(`getKey(U1)     : ${await proxy.functions['getKey(address)'](wallet.address)}`);
	console.log("");


	proxy = await sdk.contracts.upgradeProxy(
		proxy,
		"WalletMultisigV2",
		[
			[ sdk.utils.addrToKey(wallet.address) ],
			[ "0x0000000000000000000000000000000000000000000000000000000000000001" ],
			1,
			1,
		],
		(proxy, tx, config) => sdk.multisig.execute(proxy, [ wallet ], tx, config),
		{ deploy: { enable: true }, options: { gasLimit: 1000000 } }
	);

	console.log(`proxy          : ${proxy.address}`               );
	console.log(`implementation : ${await proxy.implementation()}`);
	console.log(`owner          : ${await proxy.owner()}`         );
	console.log(`getKey(U1)     : ${await proxy.functions['getKey(address)'](wallet.address)}`);
	console.log(`domain         : ${await proxy.domain()}`        );
	console.log("");

})();
