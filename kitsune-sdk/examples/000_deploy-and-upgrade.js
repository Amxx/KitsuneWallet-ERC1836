const { ethers } = require('ethers');
const { SDK }    = require('../dist/sdk');
const { createMockProvider, getWallets, solidity} = require('ethereum-waffle');

ethers.errors.setLogLevel('error');

(async () => {

	const provider = createMockProvider();
	const [ relayer, user1, user2, user3 ] = getWallets(provider);
	await provider.ready;

	const sdk = new SDK(provider, relayer);

	// ------------------------ Check master deployments ------------------------
	// for (let master of Object.keys(sdk.contracts.ABIS).filter(name => name !== "Proxy"))
	// {
	// 	let instance = await sdk.contracts.getMasterInstance(master);
	// 	console.log(`${master} is available on chain '${name}' (${chainId}).`)
	// 	console.log(`→ ${instance['address']}`);
	// 	console.log(`---`);
	// }

	// ------------------------------ create proxy ------------------------------
	let proxy = null;

	{
		console.log("Deploying proxy: WalletOwnable\n");

		proxy = await sdk.contracts.deployProxy("WalletOwnable", [ user1.address ], { deploy: { enable: true } });

		console.log(`proxy          : ${proxy.address}`               );
		console.log(`implementation : ${await proxy.implementation()}`);
		console.log(`selector       : ${await proxy.selector()}`      );
		console.log(`owner          : ${await proxy.owner()}`         );
		console.log("");
	}

	// --------------------- WalletOwnable → WalletMultisig ---------------------
	{
		console.log("\nUpdating proxy: WalletOwnable → WalletMultisig\n");

		let updateMasterTx = sdk.transactions.updateImplementation(
			"WalletMultisig",
			sdk.transactions.initialization(
				"WalletMultisig",
				[
					[ sdk.utils.addrToKey(user1.address) ],
					[ "0x0000000000000000000000000000000000000000000000000000000000000001" ],
					1,
					1,
				]
			),
			{ deploy: { enable: true } }
		);

		await user1.sendTransaction({
			to:       proxy.address,
			data:     updateMasterTx,
			gasLimit: 1000000
		});

		proxy = sdk.contracts.viewContract("WalletMultisig", proxy.address);

		console.log(`proxy          : ${proxy.address}`               );
		console.log(`implementation : ${await proxy.implementation()}`);
		console.log(`selector       : ${await proxy.selector()}`      );
		console.log(`owner          : ${await proxy.owner()}`         );
		console.log(`getKey(U1)     : ${await proxy.functions['getKey(address)'](user1.address)}`);
		console.log(`getKey(U2)     : ${await proxy.functions['getKey(address)'](user2.address)}`);
		console.log(`getKey(U3)     : ${await proxy.functions['getKey(address)'](user3.address)}`);
	}

	// ------------ WalletMultisig → WalletMultisigRefundOutOfOrder -------------
	{
		console.log("\nUpdating proxy: WalletMultisig → WalletMultisigRefundOutOfOrder\n");

		let updateMasterTx = await sdk.transactions.updateImplementation(
			"WalletMultisigRefundOutOfOrder",
			"0x",
			{ deploy: { enable: true } }
		);

		await sdk.multisig.execute(
			proxy,
			[ user1 ],
			{ to: proxy.address, data: updateMasterTx },
			{ options: { gasLimit: 1000000 } }
		);

		proxy = sdk.contracts.viewContract("WalletMultisigRefundOutOfOrder", proxy.address);

		console.log(`proxy          : ${proxy.address}`               );
		console.log(`implementation : ${await proxy.implementation()}`);
		console.log(`selector       : ${await proxy.selector()}`      );
		console.log(`owner          : ${await proxy.owner()}`         );
		console.log(`getKey(U1)     : ${await proxy.functions['getKey(address)'](user1.address)}`);
		console.log(`getKey(U2)     : ${await proxy.functions['getKey(address)'](user2.address)}`);
		console.log(`getKey(U3)     : ${await proxy.functions['getKey(address)'](user3.address)}`);
	}

})();
