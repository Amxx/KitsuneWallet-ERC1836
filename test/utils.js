const {utils} = require('ethers');

const HASHING_METATX = {
	'execute(uint256,address,uint256,bytes,uint256,bytes[])': function (proxyAddress, tx)
	{
		return utils.solidityKeccak256([
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
				utils.keccak256(tx.data),
				tx.nonce,
		]);
	},
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': function (proxyAddress, tx)
	{
		return utils.solidityKeccak256([
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
				utils.keccak256(tx.data),
				tx.nonce,
				tx.gasToken,
				tx.gasPrice,
		]);
	},
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': function (proxyAddress, tx)
	{
		return utils.solidityKeccak256([
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
				utils.keccak256(tx.data),
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
		return {type:0,value:0,data:[],gasToken:"0x0000000000000000000000000000000000000000",gasPrice:0,salt:utils.randomBytes(32), ...tx};
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

module.exports = {

	relayMetaTx: async function(proxy, txData, relayer)
	{
		return relayer.sendTransaction({ to: proxy.address, data: txData, gasLimit: 1000000 });
	},

	prepareMetaTx: async function (proxy, tx, signers, executeABI)
	{
		tx = PREPARE_TX[executeABI](tx);
		const txHash = utils.arrayify(HASHING_METATX[executeABI](proxy.address, tx));
		const signatures = await Promise.all(signers.sort((a,b) => a.address-b.address).map(signer => signer.signMessage(txHash)));
		return proxy.interface.functions[executeABI].encode([...INLINE_TX[executeABI](tx), signatures]);
	},
}
