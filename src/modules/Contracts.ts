import { ethers } from 'ethers';
import * as types from "../types";

import ModuleBase from "./__ModuleBase";

export class Contracts extends ModuleBase
{
	viewContract(
		name:    string,
		address: string,
	) : types.contract
	{
		return new ethers.Contract(address, this.sdk.ABIS[name].abi, this.sdk.provider);
	}

	deployContract(
		name:   string,
		args:   types.args,
		config: types.config = {},
	) : Promise<types.contract>
	{
		return new Promise((resolve, reject) => {
			(new ethers.ContractFactory(
				this.sdk.ABIS[name].abi,
				this.sdk.ABIS[name].bytecode,
				config['wallet'] || this.sdk.wallet || reject(Error("Missing wallet")),
			))
			.deploy(...args)
			.then(
				instance => instance.deployed()
				.then(resolve)
				.catch(reject)
			)
			.catch(reject);
		});
	}

	getMasterInstance(
		name:   string,
		config: types.config = {},
	) : Promise<types.contract>
	{
		return new Promise((resolve, reject) => {
			this.sdk.provider.getNetwork()
			.then(network => {
				network.chainId = 17;
				try
				{
					resolve(this.viewContract(name, this.sdk.ABIS[name].networks[network.chainId].address));
				}
				catch
				{
					if (config['allowDeploy'])
					{
						this.deployContract(name, [], config)
						.then(instance => {
							this.sdk.ABIS[name].networks[network.chainId] = {
								"events": {}
							, "links": {}
							, "address": instance['address']
							, "transactionHash": instance['deployTransaction'].hash
							};
							resolve(instance);
						})
						.catch(reject);
					}
					else
					{
						reject(Error("Master is not available on this network, try setting config['allowDeploy'] to true"));
					}
				}
			})
			.catch(reject);
		});
	}

	deployProxy(
		name:   string,
		args:   types.args,
		config: types.config = {},
	): Promise<types.contract>
	{
		return new Promise((resolve, reject) => {
			this.getMasterInstance(name, config)
			.then(instance => {
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
		args:    types.args,
		execute: types.txExecutor,
		config:  types.config = {},
	) : Promise<types.contract>
	{
		return new Promise((resolve, reject) => {
			this.sdk.transactions.updateMaster(
				name,
				args ? this.sdk.transactions.initialization(name, args) : "0x",
				config
			)
			.then(initData => {
				execute(proxy, { to: proxy.address, data: initData }, config)
				.then(_ => {
					proxy = this.viewContract(name, proxy.address);
					resolve(proxy);
				})
				.catch(reject);
			})
			.catch(reject);
		});
	}
}
