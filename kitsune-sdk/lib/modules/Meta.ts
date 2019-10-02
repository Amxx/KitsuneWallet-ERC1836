import { ethers } from 'ethers';
import * as types from "../typings/all";

ethers.errors.setLogLevel('error');

const sigUtil = require('eth-sig-util')

const TYPES: object =
{
	EIP712Domain: [
		{ name: "name",              type: "string"  },
		{ name: "version",           type: "string"  },
		{ name: "chainId",           type: "uint256" },
		{ name: "verifyingContract", type: "address" },
	],
	TX: [
		{ name: "op",    type: "uint8"   },
		{ name: "to",    type: "address" },
		{ name: "value", type: "uint256" },
		{ name: "data",  type: "bytes"   },
		{ name: "nonce", type: "uint256" },
	],
	TXS: [
		{ name: "transactions", type: "TX[]" },
	],
}

export function hash(abi: string, tx: types.ethereum.metatx, proxy: types.contract) : types.ethereum.bytes32
{
	switch (abi)
	{
		case 'execute(uint256,address,uint256,bytes,uint256,bytes[])':
			return ethers.utils.solidityKeccak256([
				'address',
				'uint256',
				'address',
				'uint256',
				'bytes32',
				'uint256',
			],[
				proxy.address,
				tx.op,
				tx.to,
				tx.value,
				ethers.utils.keccak256(tx.data),
				tx.nonce,
			]);

		case 'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])':
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
				proxy.address,
				tx.op,
				tx.to,
				tx.value,
				ethers.utils.keccak256(tx.data),
				tx.nonce,
				tx.gasToken,
				tx.gasPrice,
			]);

		case 'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])':
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
				proxy.address,
				tx.op,
				tx.to,
				tx.value,
				ethers.utils.keccak256(tx.data),
				tx.nonce,
				tx.salt,
				tx.gasToken,
				tx.gasPrice,
			]);

		default:
			throw new Error(`[ERROR] Meta.hash does not support abi ${abi}`)
	}
}

export function sanitize(abi: string, tx: types.ethereum.metatx) : types.ethereum.metatx
{
	switch (abi)
	{
		case 'execute(uint256,address,uint256,bytes,uint256,bytes[])':
			return {op:0,value:0,data:"0x", ...tx};

		case 'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])':
			return {op:0,value:0,data:"0x",gasToken:ethers.constants.AddressZero,gasPrice:0, ...tx};

		case 'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])':
			return {op:0,value:0,data:"0x",gasToken:ethers.constants.AddressZero,gasPrice:0,salt:ethers.utils.hexlify(ethers.utils.randomBytes(32)), ...tx};

		case 'execute((uint256,address,uint256,bytes,uint256),bytes[])':
			return {op:0,value:0,data:"0x", ...tx};

		default:
			throw new Error(`[ERROR] Meta.sanitize does not support abi ${abi}`)
	}
}

export function sign(abi: string, tx: types.ethereum.metatx, proxy: types.contract, signer: types.wallet) : Promise<types.ethereum.bytes>
{
	switch (abi)
	{
		case 'execute(uint256,address,uint256,bytes,uint256,bytes[])':
		case 'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])':
		case 'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])':
			return signer.signMessage(ethers.utils.arrayify(hash(abi, tx, proxy)))

		case 'execute((uint256,address,uint256,bytes,uint256),bytes[])':
			return new Promise((resolve, reject) => {
				proxy.domain()
				.then(domain => {
					let data =
					{
						types: TYPES,
						primaryType: 'TX',
						domain:
						{
							name:              domain.name,
							version:           domain.version,
							chainId:           domain.chainId.toString(),
							verifyingContract: domain.verifyingContract
						},
						message:
						{
							op:    tx.op.toString(),
							to:    tx.to,
							value: tx.value.toString(),
							data:  tx.data,
							nonce: tx.nonce.toString()
						},
					}

					signer.provider._sendAsync({
						method: "eth_signTypedData_v4",
						params: [ signer.address, JSON.stringify({ data }) ],
						from: signer.address,
					}, (err, result) => {
						if (!err)
						{
							resolve(result.result)
						}
						else
						{
							resolve(sigUtil.signTypedData(Buffer.from(signer.signingKey.privateKey.substr(2), 'hex'), { data }))
						}
					});
				})
				.catch(reject)
			});

		default:
			throw new Error(`[ERROR] Meta.sign does not support abi ${abi}`)
	}
}

export function inline(abi: string, tx: types.ethereum.metatx) : types.ethereum.args
{
	switch (abi)
	{
		case 'execute(uint256,address,uint256,bytes,uint256,bytes[])':
			return [ tx.op, tx.to, tx.value, tx.data, tx.nonce ];

		case 'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])':
			return [ tx.op, tx.to, tx.value, tx.data, tx.nonce, tx.gasToken, tx.gasPrice ];

		case 'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])':
			return [ tx.op, tx.to, tx.value, tx.data, tx.nonce, tx.salt, tx.gasToken, tx.gasPrice ];

		case 'execute((uint256,address,uint256,bytes,uint256),bytes[])':
			return [[tx.op, tx.to, tx.value, tx.data, tx.nonce]];

		default:
			throw new Error(`[ERROR] Meta.inline does not support abi ${abi}`)
	}
}

export default {
	sanitize,
	hash,
	sign,
	inline,
};
