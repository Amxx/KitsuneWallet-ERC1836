module.exports = {

	addressToBytes32: function(address)
	{
		return web3.utils.keccak256(address);
	},
	addressToBytes32Padding: function(address)
	{
		return web3.utils.padLeft(address, 64);
	},

	prepareData: function(target, method, args)
	{
		return web3.eth.abi.encodeFunctionCall(target.abi.filter(e => e.type == "function" && e.name == method)[0], args);
	},

	signMetaTX_Multisig: function(identity, metatx, signer)
	{
		return new Promise(async (resolve, reject) => {
			if (metatx.from     == undefined) metatx.from     = identity.address;
			if (metatx.value    == undefined) metatx.value    = 0;
			if (metatx.data     == undefined) metatx.data     = "";
			if (metatx.nonce    == undefined) metatx.nonce    = (await identity.nonce()).toNumber() + 1;

			web3.eth.sign(
				web3.utils.keccak256(web3.eth.abi.encodeParameters([
					"address",
					"uint256",
					"address",
					"uint256",
					"bytes32",
					"uint256",
				],[
					metatx.from,
					metatx.type,
					metatx.to,
					metatx.value,
					web3.utils.keccak256(metatx.data) || "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
					metatx.nonce,
				])),
				signer
			)
			.then(signature => {
				if (metatx.signature === undefined)
				{
					metatx.signature = [];
				}
				metatx.signature.push(signature);
				resolve(metatx);
			})
			.catch(reject);
		});
	},

	sendMetaTX_Multisig: function(identity, metatx, signer, relay)
	{
		return new Promise(async (resolve, reject) => {
			this.signMetaTX_Multisig(identity, metatx, signer).then((signedmetatx) => {
				identity.execute(
					signedmetatx.type,
					signedmetatx.to,
					signedmetatx.value,
					signedmetatx.data,
					signedmetatx.nonce,
					signedmetatx.signature,
					{ from : relay }
				)
				.then(resolve)
				.catch(reject);
			})
		});
	},

	signMetaTX_MultisigRefund: function(identity, metatx, signer)
	{
		return new Promise(async (resolve, reject) => {
			if (metatx.from     == undefined) metatx.from     = identity.address;
			if (metatx.value    == undefined) metatx.value    = 0;
			if (metatx.data     == undefined) metatx.data     = [];
			if (metatx.nonce    == undefined) metatx.nonce    = (await identity.nonce()).toNumber() + 1;
			if (metatx.gasPrice == undefined) metatx.gasPrice = 0;
			if (metatx.gasToken == undefined) metatx.gasToken = "0x0000000000000000000000000000000000000000";

			web3.eth.sign(
				web3.utils.keccak256(web3.eth.abi.encodeParameters([
					"address",
					"uint256",
					"address",
					"uint256",
					"bytes32",
					"uint256",
					"address",
					"uint256",
				],[
					metatx.from,
					metatx.type,
					metatx.to,
					metatx.value,
					web3.utils.keccak256(metatx.data) || "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
					metatx.nonce,
					metatx.gasToken,
					metatx.gasPrice,
				])),
				signer
			)
			.then(signature => {
				if (metatx.signature === undefined)
				{
					metatx.signature = [];
				}
				metatx.signature.push(signature);
				resolve(metatx);
			})
			.catch(reject);
		});
	},

	sendMetaTX_MultisigRefund: function(identity, metatx, signer, relay)
	{
		return new Promise(async (resolve, reject) => {
			this.signMetaTX_MultisigRefund(identity, metatx, signer).then((signedmetatx) => {
				identity.execute(
					signedmetatx.type,
					signedmetatx.to,
					signedmetatx.value,
					signedmetatx.data,
					signedmetatx.nonce,
					signedmetatx.gasToken,
					signedmetatx.gasPrice,
					signedmetatx.signature,
					{ from : relay }
				)
				.then(resolve)
				.catch(reject);
			})
		});
	},


	signMetaTX_Universal: function(identity, metatx, signer)
	{
		return new Promise(async (resolve, reject) => {
			if (metatx.from     == undefined) metatx.from     = identity.address;
			if (metatx.value    == undefined) metatx.value    = 0;
			if (metatx.data     == undefined) metatx.data     = [];
			if (metatx.nonce    == undefined) metatx.nonce    = Number(await identity.lastNonce());
			if (metatx.gasPrice == undefined) metatx.gasPrice = 0;
			if (metatx.gasToken == undefined) metatx.gasToken = "0x0000000000000000000000000000000000000000";
			if (metatx.gasLimit == undefined) metatx.gasLimit = 0;

			web3.eth.sign(
				web3.utils.soliditySha3(
					{ t: "address", v: metatx.from                                                                                               },
					{ t: "address", v: metatx.to                                                                                                 },
					{ t: "uint256", v: metatx.value                                                                                              },
					{ t: "bytes32", v: web3.utils.keccak256(metatx.data) || "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470" },
					{ t: "uint256", v: metatx.nonce                                                                                              },
					{ t: "uint256", v: metatx.gasPrice                                                                                           },
					{ t: "address", v: metatx.gasToken                                                                                           },
					{ t: "uint256", v: metatx.gasLimit                                                                                           },
					{ t: "uint256", v: metatx.type                                                                                               },
				),
				signer
			)
			.then(signature => {
				metatx.signature = signature;
				resolve(metatx);
			})
			.catch(reject);
		});
	},

	sendMetaTX_Universal: function(identity, metatx, signer, relay)
	{
		return new Promise(async (resolve, reject) => {
			this.signMetaTX_Universal(identity, metatx, signer).then((signedmetatx) => {
				identity.executeSigned(
					signedmetatx.to,
					signedmetatx.value,
					signedmetatx.data,
					signedmetatx.nonce,
					signedmetatx.gasPrice,
					signedmetatx.gasToken,
					signedmetatx.gasLimit,
					signedmetatx.type,
					signedmetatx.signature,
					{ from : relay }
				)
				.then(resolve)
				.catch(reject);
			})
		});
	},
}
