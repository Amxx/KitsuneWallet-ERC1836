const { ethers }         = require('ethers');
const { throwIfMissing } = require('./utils.js');

const HASHING_METATX = {
	'execute(uint256,address,uint256,bytes,uint256,bytes[])': function (proxyAddress, tx)
	{
		return ethers.utils.solidityKeccak256([
				'address',
				'uint256',
				'address',
				'uint256',
				'bytes32',
				'uint256',
			],[
				proxyAddress,
				tx.type,
				tx.to,
				tx.value,
				ethers.utils.keccak256(tx.data),
				tx.nonce,
		]);
	},
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': function (proxyAddress, tx)
	{
		return ethers.utils.solidityKeccak256([
				'address',
				'uint256',
				'address',
				'uint256',
				'bytes32',
				'uint256',
				'address',
				'uint256',
			],[
				proxyAddress,
				tx.type,
				tx.to,
				tx.value,
				ethers.utils.keccak256(tx.data),
				tx.nonce,
				tx.gasToken,
				tx.gasPrice,
		]);
	},
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': function (proxyAddress, tx)
	{
		return ethers.utils.solidityKeccak256([
				'address',
				'uint256',
				'address',
				'uint256',
				'bytes32',
				'uint256',
				'bytes32',
				'address',
				'uint256',
			],[
				proxyAddress,
				tx.type,
				tx.to,
				tx.value,
				ethers.utils.keccak256(tx.data),
				tx.nonce,
				tx.salt,
				tx.gasToken,
				tx.gasPrice,
		]);
	},
};

const PREPARE_TX = {
	'execute(uint256,address,uint256,bytes,uint256,bytes[])': function (tx)
	{
		return {type:0,value:0,data:[], ...tx};
	},
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': function (tx)
	{
		return {type:0,value:0,data:[],gasToken:"0x0000000000000000000000000000000000000000",gasPrice:0, ...tx};
	},
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': function (tx)
	{
		return {type:0,value:0,data:[],gasToken:"0x0000000000000000000000000000000000000000",gasPrice:0,salt:ethers.utils.randomBytes(32), ...tx};
	},
};

const INLINE_TX = {
	'execute(uint256,address,uint256,bytes,uint256,bytes[])': function (tx)
	{
		return [ tx.type, tx.to, tx.value, tx.data, tx.nonce ]
	},
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': function (tx)
	{
		return [ tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.gasToken, tx.gasPrice ]
	},
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': function (tx)
	{
		return [ tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.salt, tx.gasToken, tx.gasPrice ]
	},
};

const sign = (
	proxy   = throwIfMissing(),
	tx      = throwIfMissing(),
	signers = [],
) => {
	let executeABI = Object.keys(proxy.interface.functions).filter(fn => fn.startsWith("execute(") && fn !== 'execute(uint256,address,uint256,bytes)')[0]
	return new Promise(function(resolve, reject) {
		proxy.nonce()
		.then(previousNonce => {
			let txFull = PREPARE_TX[executeABI]({ nonce: previousNonce.toNumber() + 1, ...tx });
			let txHash = ethers.utils.arrayify(HASHING_METATX[executeABI](proxy.address, txFull));
			Promise.all(signers.sort((a,b) => a.address-b.address).map(signer => signer.signMessage(txHash)))
			.then(signatures => {
				resolve({ to: proxy.address, data: proxy.interface.functions[executeABI].encode([...INLINE_TX[executeABI](txFull), signatures]) });
			})
			.catch(reject);
		})
		.catch(reject);
	});
}

const relay = (
	sdk     = throwIfMissing(),
	txData  = throwIfMissing(),
	relayer = null,
	params  = {},
) => {
	return (relayer || sdk.defaultRelayer).sendTransaction({ ...txData, gasLimit: 1000000, ...params });
}

module.exports = {
	sign,
	relay,
}
