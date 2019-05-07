const { ethers } = require('ethers');

const setKey = (
	sdk     = throwIfMissing(),
	proxy   = throwIfMissing(),
	key     = throwIfMissing(),
	purpose = throwIfMissing(),
	signers = throwIfMissing(),
	relayer = null,
	params  = {}
) => {
	return new Promise(function(resolve, reject) {
		sdk.transactions.sign(
			proxy,
			{
				to: proxy.address,
				data: proxy.interface.functions['setKey(bytes32,bytes32)'].encode([ key, purpose ])
			},
			signers
		)
		.then(txData => {
			sdk.transactions.relay(txData, relayer, params)
			.then(resolve)
			.catch(reject);
		})
		.catch(reject);
	});
}

module.exports = {
	setKey
}
