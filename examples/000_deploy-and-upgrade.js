const { ethers } = require('ethers');
const { createMockProvider, getWallets, solidity} = require('ethereum-waffle');
const { Sdk }    = require('../sdk/sdk.js');

ethers.errors.setLogLevel('error');

const provider = createMockProvider();
const [ relayer, user1, user2, user3 ] = getWallets(provider);

provider.ready.then(async () => {

	const sdk = new Sdk(provider, relayer);

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

		proxy = await sdk.contracts.deployProxy("WalletOwnable", [ user1.address ]);

		console.log(`proxy    : ${proxy.address}`         );
		console.log(`master   : ${await proxy.master()}`  );
		console.log(`masterId : ${await proxy.masterId()}`);
		console.log(`owner    : ${await proxy.owner()}`   );
		console.log("");
	}

	// ----------------- master: WalletOwnable → WalletMultisig -----------------
	{
		console.log("\nUpdating proxy: WalletOwnable → WalletMultisig\n");

		let updateMasterTx = sdk.transactions.prepare.updateMaster(
			[
				(await sdk.contracts.getMasterInstance("WalletMultisig")).address,
				sdk.transactions.prepare.initialization(
					"WalletMultisig",
					[
						[ sdk.utils.addrToKey(user1.address) ],
						[ "0x0000000000000000000000000000000000000000000000000000000000000001" ],
						1,
						1,
					]
				),
				true,
			]
		);

		await (await proxy.connect(user1).execute(0, proxy.address, 0, updateMasterTx, { gasLimit: 800000 })).wait();

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

		let updateMasterTx = sdk.transactions.prepare.updateMaster(
			[
				(await sdk.contracts.getMasterInstance("WalletMultisigRefundOutOfOrder")).address,
				"0x",  // no initialization
				false, // no reset (memory pattern are compatible)
			]
		);

		await sdk.transactions.relay(
			await sdk.transactions.sign(
				proxy,                                                    // proxy
				{ to: proxy.address, data: updateMasterTx },              // tx
				[ user1 ],                                                // signer
			)
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
