const   chai     = require('chai');
const { expect } = chai;
const { ethers } = require('ethers');
const   utils    = require('../utils/utils');
const { createMockProvider, getWallets, solidity} = require('ethereum-waffle');

chai.use(solidity);
ethers.errors.setLogLevel('error');

// const provider = new ethers.providers.JsonRpcProvider();
// const accounts = [
//   "<privatekey_0>"
// , "<privatekey_1>"
// , "<privatekey_2>"
// , "<privatekey_3>"
// , "<privatekey_4>"
// , "<privatekey_5>"
// , "<privatekey_6>"
// , "<privatekey_7>"
// , "<privatekey_8>"
// , "<privatekey_9>"
// ].map(pk => new ethers.Wallet(pk, provider));
// const [ relayer, user1, user2, user3 ] = accounts;

const provider = createMockProvider();
const [ relayer, user1, user2, user3 ] = getWallets(provider);

async function deployContract(contract, args = [])
{
	return new Promise(function(resolve, reject) {
		(new ethers.ContractFactory(contract.abi, contract.bytecode, relayer))
		.deploy(...args)
		.then(
			contract => contract.deployed()
			.then(resolve)
			.catch(reject)
		)
		.catch(reject)
	});
}

provider.ready.then(async ({ chainId, name }) => {

	const contracts = new Map([
	  "Proxy"
	, "WalletOwnable"
	, "WalletMultisig"
	, "WalletMultisigRefund"
	, "WalletMultisigRefundOutOfOrder"
	].map(key => [ key, require(`../build/${key}`) ]));

	const masters = [
	  "WalletOwnable"
	, "WalletMultisig"
	, "WalletMultisigRefund"
	, "WalletMultisigRefundOutOfOrder"
	];

	for (let master of masters)
	{
		let contract = await deployContract(contracts.get(master));
		contracts.get(master).networks[chainId] = {
		  "events": {}
		, "links": {}
		, "address": contract['address']
		, "transactionHash": contract['deployTransaction'].hash
		};
		console.log(`${master} : ${contract['address']}`);
	}

	let proxyAddr = null;
	let proxy     = null;

	// ------------------------------ create proxy ------------------------------
	{
		console.log("\nDeploying proxy: WalletOwnable\n");

		let initializationTx = new ethers.utils.Interface(contracts.get("WalletOwnable").abi).functions.initialize.encode([
			user1.address
		]);

		proxyAddr = (await deployContract(contracts.get("Proxy"), [
			contracts.get("WalletOwnable").networks[chainId].address,
			initializationTx,
			{ gasLimit: 1000000 }
		]))['address'];

		proxy = new ethers.Contract(proxyAddr, contracts.get("WalletOwnable").abi, provider);

		console.log("proxy    :", proxy.address);
		console.log("master   :", await proxy.master());
		console.log("masterId :", await proxy.masterId());
		console.log("owner    :", await proxy.owner());
	}

	// ----------------- master: WalletOwnable → WalletMultisig -----------------
	{
		console.log("\nUpdating proxy: WalletOwnable → WalletMultisig\n");

		let initializationTx = new ethers.utils.Interface(contracts.get("WalletMultisig").abi).functions.initialize.encode([
			[ ethers.utils.hexZeroPad(user1.address, 32).toString().toLowerCase() ],
			[ "0x0000000000000000000000000000000000000000000000000000000000000001" ],
			1,
			1,
		]);

		let updateMasterTx = new ethers.utils.Interface(contracts.get("WalletOwnable").abi).functions.updateMaster.encode([
			contracts.get("WalletMultisig").networks[chainId].address,
			initializationTx,
			true,
		]);

		await (await proxy.connect(user1).execute(0, proxyAddr, 0, updateMasterTx, { gasLimit: 800000 })).wait();

		proxy = new ethers.Contract(proxyAddr, contracts.get("WalletMultisig").abi, provider);

		console.log("proxy      :", proxy.address);
		console.log("master     :", await proxy.master());
		console.log("masterId   :", await proxy.masterId());
		console.log("owner      :", await proxy.owner());
		console.log("getKey(U1) :", await proxy.functions['getKey(address)'](user1.address));
		console.log("getKey(U2) :", await proxy.functions['getKey(address)'](user2.address));
		console.log("getKey(U3) :", await proxy.functions['getKey(address)'](user3.address));
	}

	// -------- master: WalletMultisig → WalletMultisigRefundOutOfOrder ---------
	{
		console.log("\nUpdating proxy: WalletMultisig → WalletMultisigRefundOutOfOrder\n");

		let updateMasterTx = new ethers.utils.Interface(contracts.get("WalletMultisig").abi).functions.updateMaster.encode([
			contracts.get("WalletMultisigRefundOutOfOrder").networks[chainId].address,
			"0x",  // no initialization
			false, // no reset (memory pattern are compatible)
		]);

		await utils.relayMetaTx(
			await utils.prepareMetaTx(
				proxy,                                                    // proxy
				{ to: proxyAddr, data: updateMasterTx },                  // tx
				[ user1 ],                                                // signer
				Object.keys(proxy.interface.functions).filter(fn => fn.startsWith("execute(") && fn !== 'execute(uint256,address,uint256,bytes)')[0] // 'execute(uint256,address,uint256,bytes,uint256,bytes[])', // executeABI
			),
			relayer
		);

		proxy = new ethers.Contract(proxyAddr, contracts.get("WalletMultisigRefundOutOfOrder").abi, provider);

		console.log("proxy      :", proxy.address);
		console.log("master     :", await proxy.master());
		console.log("masterId   :", await proxy.masterId());
		console.log("owner      :", await proxy.owner());
		console.log("getKey(U1) :", await proxy.functions['getKey(address)'](user1.address));
		console.log("getKey(U2) :", await proxy.functions['getKey(address)'](user2.address));
		console.log("getKey(U3) :", await proxy.functions['getKey(address)'](user3.address));
	}

});
