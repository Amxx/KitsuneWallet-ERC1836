import { ethers } from 'ethers';
import * as types from '../typings/all';

import ModuleBase from './__ModuleBase';
import ActiveAdresses from '@kitsune-wallet/contracts/deployments/active.json';

export class Contracts extends ModuleBase
{
	deployments : types.map<string, { address: types.ethereum.address, hash: types.ethereum.bytes32 }>;

	async init()
	{
		this.deployments = ActiveAdresses[(await this.sdk.provider.getNetwork()).chainId] || {};
	}

	viewContract(
		name:    string,
		address: types.ethereum.address,
	) : types.contract {
		return new ethers.Contract(ethers.utils.hexlify(address), this.sdk.ABIS[name].abi, this.sdk.provider);
	}

	deployContract(
		name:   string,
		args:   types.ethereum.args,
		config: types.config = {},
	) : Promise<types.contract> {
		return new Promise((resolve, reject) => {
			(new ethers.ContractFactory(
				this.sdk.ABIS[name].abi,
				this.sdk.ABIS[name].bytecode,
				config.wallet || this.sdk.wallet || reject(Error("Missing wallet")),
			))
			.deploy(...args) // TRANSACTION
			.then(_ => {
				_.deployed()
				.then(async instance => {
					if (!(config.deploy !== undefined && config.deploy.noTrack))
					{
						if (this.deployments == undefined) { await this.init(); }
						this.deployments[name] = {
							address: instance.address,
							hash:    ethers.utils.keccak256(`0x${this.sdk.ABIS[name].bytecode}`),
						};
					}
					resolve(instance);
				})
				.catch(reject)
			})
			.catch(reject);
		});
	}

	getActiveInstance(
		name:   string,
		config: types.config = {},
	) : Promise<types.contract> {
		return new Promise(async (resolve, reject) => {
			try
			{
				if (this.deployments == undefined)
				{
					await this.init();
				}
				if (this.deployments[name].hash != ethers.utils.keccak256(`0x${this.sdk.ABIS[name].bytecode}`))
				{
					console.log(`[WARNING] deployed contract bytecode missmatch for ${name}`);
				}
				resolve(this.viewContract(name, this.deployments[name].address));
			}
			catch
			{
				if (config.deploy !== undefined && config.deploy.enable)
				{
					this.deployContract(name, config.deploy.args || [], config).then(resolve).catch(reject);
				}
				else
				{
					reject(Error("No active instance are tracked on this network, try setting config.deploy.enable to deploy one"));
				}
			}
		});
	}

	deployProxy(
		name:   string,
		args:   types.ethereum.args,
		config: types.config = {},
	): Promise<types.contract> {
		return new Promise((resolve, reject) => {
			this.getActiveInstance(name, config)
			.then((instance: types.contract) => {
				this.deployContract("Proxy", [ instance.address, this.sdk.transactions.initialization(name, args) ])
				.then(proxy => resolve(this.viewContract(name, proxy.address)))
				.catch(reject);
			})
			.catch(reject);
		});
	}

	upgradeProxy(
		proxy:   types.contract,
		name:    string,
		args:    types.ethereum.args,
		execute: types.txExecutor,
		config:  types.config = {},
	) : Promise<types.contract> {
		return new Promise((resolve, reject) => {
			this.sdk.transactions.updateImplementation(
				name,
				args ? this.sdk.transactions.initialization(name, args) : "0x",
				config
			)
			.then((initializationData: types.ethereum.bytes) => {
				execute(proxy, { to: proxy.address, data: initializationData }, config)
				.then(() => {
					proxy = this.viewContract(name, proxy.address);
					resolve(proxy);
				})
				.catch(reject);
			})
			.catch(reject);
		});
	}
}
