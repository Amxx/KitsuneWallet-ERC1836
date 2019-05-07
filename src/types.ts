import { ethers } from 'ethers';

export type args       = any[];
export type config     = {};
export type contract   = ethers.Contract;
export type wallet     = ethers.Wallet;
export type provider   = ethers.providers.Provider;
export type txExecutor = (proxy: contract, tx: object, config: config) => Promise<{}>;
