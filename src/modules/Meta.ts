import { ethers } from 'ethers';
import * as types from "../types/all";

export const HASHING_METATX = {
	'execute(uint256,address,uint256,bytes,uint256,bytes[])': (proxyAddress: types.ethereum.address, tx: types.ethereum.metatx) : types.ethereum.bytes32 =>
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
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': (proxyAddress: types.ethereum.address, tx: types.ethereum.metatx) : types.ethereum.bytes32 =>
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
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': (proxyAddress: types.ethereum.address, tx: types.ethereum.metatx) : types.ethereum.bytes32 =>
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

export const PREPARE_TX = {
	'execute(uint256,address,uint256,bytes,uint256,bytes[])': (tx: types.ethereum.metatx) : types.ethereum.metatx =>
	{
		return {type:0,value:0,data:"0x", ...tx};
	},
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': (tx: types.ethereum.metatx) : types.ethereum.metatx =>
	{
		return {type:0,value:0,data:"0x",gasToken:"0x0000000000000000000000000000000000000000",gasPrice:0, ...tx};
	},
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': (tx: types.ethereum.metatx) : types.ethereum.metatx =>
	{
		return {type:0,value:0,data:"0x",gasToken:"0x0000000000000000000000000000000000000000",gasPrice:0,salt:ethers.utils.hexlify(ethers.utils.randomBytes(32)), ...tx};
	},
};

export const INLINE_TX = {
	'execute(uint256,address,uint256,bytes,uint256,bytes[])': (tx: types.ethereum.metatx) : types.ethereum.args =>
	{
		return [ tx.type, tx.to, tx.value, tx.data, tx.nonce ]
	},
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': (tx: types.ethereum.metatx) : types.ethereum.args =>
	{
		return [ tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.gasToken, tx.gasPrice ]
	},
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': (tx: types.ethereum.metatx) : types.ethereum.args =>
	{
		return [ tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.salt, tx.gasToken, tx.gasPrice ]
	},
};
