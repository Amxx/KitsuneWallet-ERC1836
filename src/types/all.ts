import { ethers } from 'ethers';
import * as ethereum from './ethereum';

// export ethereum types
export { ethereum };

// Web3 Objects
export type contract = ethers.Contract;
export type wallet   = ethers.Wallet;
export type provider = ethers.providers.Provider;
export type network  = { chainId: number, name: string }

// SDK specific
export type config = {
	allowDeploy ? : boolean,
	proxyReset  ? : boolean,
	wallet      ? : wallet,
	options     ? : ethereum.tx,
}

export type txExecutor = (proxy: contract, tx: ethereum.tx, config: config) => Promise<{}>;
