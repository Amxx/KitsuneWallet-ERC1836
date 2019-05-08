import { ethers } from 'ethers';
import * as types from "../typings/all";

export const HASHING_METATX : types.map<string, (proxy: types.ethereum.address, tx: types.ethereum.metatx) => types.ethereum.bytes32> =
{
	'execute(uint256,address,uint256,bytes,uint256,bytes[])': (proxyAddress, tx) =>
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
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': (proxyAddress, tx) =>
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
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': (proxyAddress, tx) =>
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

export const PREPARE_TX : types.map<string, (tx: types.ethereum.metatx) => types.ethereum.metatx> =
{
	'execute(uint256,address,uint256,bytes,uint256,bytes[])':                         (tx) => { return {type:0,value:0,data:"0x", ...tx}; },
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])':         (tx) => { return {type:0,value:0,data:"0x",gasToken:ethers.constants.AddressZero,gasPrice:0, ...tx}; },
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': (tx) => { return {type:0,value:0,data:"0x",gasToken:ethers.constants.AddressZero,gasPrice:0,salt:ethers.utils.hexlify(ethers.utils.randomBytes(32)), ...tx}; },
};

export const INLINE_TX : types.map<string, (tx: types.ethereum.metatx) => types.ethereum.args> =
{
	'execute(uint256,address,uint256,bytes,uint256,bytes[])':                         (tx) => [ tx.type, tx.to, tx.value, tx.data, tx.nonce ],
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])':         (tx) => [ tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.gasToken, tx.gasPrice ],
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': (tx) => [ tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.salt, tx.gasToken, tx.gasPrice ],
};
