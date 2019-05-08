import { ethers } from 'ethers';

// Solidity
export type uint256   = string | number | ethers.utils.BigNumber;
export type address   = string | Uint8Array;
export type bytes32   = string | Uint8Array;
export type bytes     = string | Uint8Array;
export type arg       = address | uint256 | bytes32 | bytes | args;
export interface args extends Array<arg> {};

// Transactions & Meta-Transactions
export interface metatx
{
	type     ? : uint256,
	to       ? : address,
	value    ? : uint256,
	data     ? : bytes,
	nonce    ? : uint256,
	salt     ? : bytes32,
	gasToken ? : address,
	gasPrice ? : uint256,
}

export interface tx
{
	to       ? : address,
	value    ? : uint256,
	data     ? : bytes,
	nonce    ? : uint256,
	gasLimit ? : uint256,
	gasPrice ? : uint256,
	chainId  ? : uint256,
	wait ? : () => Promise<{}>
}

type hashing<T> = (arg: T) => bytes32;
