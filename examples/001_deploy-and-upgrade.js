const { ethers } = require('ethers');
const { createMockProvider, getWallets, solidity} = require('ethereum-waffle');
const { SDK }    = require('../dist/SDK.js');

ethers.errors.setLogLevel('error');

const provider = createMockProvider();
const [ relayer, user1, user2, user3 ] = getWallets(provider);

provider.ready.then(async () => {

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

		proxy = await sdk.contracts.deployProxy("WalletOwnable", [ user1.address ], { allowDeploy: true });

		console.log(`proxy    : ${proxy.address}`         );
		console.log(`master   : ${await proxy.master()}`  );
		console.log(`masterId : ${await proxy.masterId()}`);
		console.log(`owner    : ${await proxy.owner()}`   );
		console.log("");
	}

	// ----------------- master: WalletOwnable → WalletMultisig -----------------
	{
		console.log("\nUpdating proxy: WalletOwnable → WalletMultisig\n");

		let updateMasterTx = sdk.transactions.updateMaster(
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
			{ allowDeploy: true }
		);

		await sdk.ownable.execute(
			user1,
			proxy,
			{ to: proxy.address, data: updateMasterTx },
		);

		proxy = sdk.contracts.viewContract("WalletMultisig", proxy.address);

		console.log(`proxy      : ${proxy.address}`         );
		console.log(`master     : ${await proxy.master()}`  );
		console.log(`masterId   : ${await proxy.masterId()}`);
		console.log(`owner      : ${await proxy.owner()}`   );
		console.log(`getKey(U1) : ${await proxy.functions['getKey(address)'](user1.address)}`);
		console.log(`getKey(U2) : ${await proxy.functions['getKey(address)'](user2.address)}`);
		console.log(`getKey(U3) : ${await proxy.functions['getKey(address)'](user3.address)}`);
	}

	// -------- master: WalletMultisig → WalletMultisigRefundOutOfOrder ---------
	{
		console.log("\nUpdating proxy: WalletMultisig → WalletMultisigRefundOutOfOrder\n");

		let updateMasterTx = await sdk.transactions.updateMaster(
			"WalletMultisigRefundOutOfOrder",
			"0x",
			{ allowDeploy: true }
		);

		await sdk.multisig.execute(
			[ user1 ],
			proxy,
			{ to: proxy.address, data: updateMasterTx },
		);

		proxy = sdk.contracts.viewContract("WalletMultisigRefundOutOfOrder", proxy.address);

		console.log(`proxy      : ${proxy.address}`         );
		console.log(`master     : ${await proxy.master()}`  );
		console.log(`masterId   : ${await proxy.masterId()}`);
		console.log(`owner      : ${await proxy.owner()}`   );
		console.log(`getKey(U1) : ${await proxy.functions['getKey(address)'](user1.address)}`);
		console.log(`getKey(U2) : ${await proxy.functions['getKey(address)'](user2.address)}`);
		console.log(`getKey(U3) : ${await proxy.functions['getKey(address)'](user3.address)}`);
	}

});
