import { ethers } from 'ethers';
import * as ethereum from './ethereum';

// generic
export interface map<K extends string | number, V>
{
	[key: string]: V;
	[key: number]: V;
}

// export ethereum types
export { ethereum };

// Web3 Objects
export type contract = ethers.Contract;
export type wallet   = ethers.Wallet;
export type provider = ethers.providers.Provider;
export type network  = { chainId: number, name: string }

// SDK specific
export interface config {
	wallet    ? : wallet,
	options   ? : ethereum.tx,
	migration ? : { reset ? : boolean, },
	deploy    ? : { enable ? : boolean, noTrack ? : boolean, args ? : ethereum.args, },
}

export type txExecutor = (proxy: contract, tx: ethereum.tx, config: config) => Promise<{}>;
