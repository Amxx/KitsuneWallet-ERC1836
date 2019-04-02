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
				tx[0],                  // type
				tx[1],                  // to
				tx[2],                  // value
				utils.keccak256(tx[3]), // data
				tx[4],                  // nonce
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
				tx[0],                  // type
				tx[1],                  // to
				tx[2],                  // value
				utils.keccak256(tx[3]), // data
				tx[4],                  // nonce
				tx[5],                  // gasToken
				tx[6],                  // gasPrice
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
				tx[0],                  // type
				tx[1],                  // to
				tx[2],                  // value
				utils.keccak256(tx[3]), // data
				tx[4],                  // nonce
				tx[5],                  // salt
				tx[6],                  // gasToken
				tx[7],                  // gasPrice
		]);
	},
};

module.exports = {
	sendMetaTx: async function (proxy, tx, signers, relayer, executeABI)
	{
		const txHash = utils.arrayify(HASHING_METATX[executeABI](proxy.address, tx));
		const signatures = await Promise.all(signers.sort((a,b) => a.address-b.address).map(signer => signer.signMessage(txHash)));
		return proxy.connect(relayer).functions[executeABI](...tx, signatures, { gasLimit: 1000000 });
	},
}
