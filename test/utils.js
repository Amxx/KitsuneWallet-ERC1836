module.exports = {
	addressToBytes32: function(address)
	{
		return web3.utils.keccak256(address);
	},

	prepareData: function(target, method, args)
	{
		return web3.eth.abi.encodeFunctionCall(target.abi.filter(e => e.type == "function" && e.name == method)[0], args);
	},

	signMetaTX: function(identity, metatx, signer)
	{
		return new Promise(async (resolve, reject) => {
			if (metatx.from     == undefined) metatx.from     = identity.address;
			if (metatx.value    == undefined) metatx.value    = 0;
			if (metatx.data     == undefined) metatx.data     = [];
			if (metatx.nonce    == undefined) metatx.nonce    = Number(await identity.nonce()) + 1;
			// if (metatx.gas      == undefined) metatx.gas      = 0;
			// if (metatx.gasPrice == undefined) metatx.gasPrice = 0;
			// if (metatx.gasToken == undefined) metatx.gasToken = "0x0000000000000000000000000000000000000000";

			web3.eth.sign(
				web3.utils.keccak256(web3.eth.abi.encodeParameters([
					"address",
					"uint256",
					"address",
					"uint256",
					"bytes",
					"uint256",
				],[
					metatx.from,
					metatx.type,
					metatx.to,
					metatx.value,
					metatx.data,
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

	sendMetaTX: function(identity, metatx, signer, relay)
	{
		return new Promise(async (resolve, reject) => {
			this.signMetaTX(identity, metatx, signer).then((signedmetatx) => {
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
}
