const { ethers }         = require('ethers');
const { throwIfMissing } = require('./utils.js');

const viewContract = (
	sdk     = throwIfMissing(),
	name    = throwIfMissing(),
	address = throwIfMissing(),
) => {
	return new ethers.Contract(address, sdk.contracts.ABIS[name].abi, sdk.provider);
}

const deployContract = (
	sdk     = throwIfMissing(),
	name    = throwIfMissing(),
	args    = throwIfMissing(),
	relayer = null,
) => {
	return new Promise((resolve, reject) => {
		let contract = sdk.contracts.ABIS[name];
		(new ethers.ContractFactory(contract.abi, contract.bytecode, relayer || sdk.defaultRelayer))
		.deploy(...args)
		.then(
			instance => instance.deployed()
			.then(resolve)
			.catch(reject)
		)
		.catch(reject)
	});
}

const getMasterInstance = (
	sdk     = throwIfMissing(),
	name    = throwIfMissing(),
	relayer = null,
) => {
	return new Promise((resolve, reject) => {
		let contract = sdk.contracts.ABIS[name];
		sdk.provider.getNetwork()
		.then(network => {
			if (contract.networks[network.chainId] === undefined)
			{
				deployContract(sdk, name, [], relayer)
				.then(instance => {
					contract.networks[network.chainId] = {
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
				resolve(viewContract(sdk, name, contract.networks[network.chainId].address));
			}
		})
		.catch(reject);
	});
}

const deployProxy = (
	sdk     = throwIfMissing(),
	name    = throwIfMissing(),
	args    = [],
	relayer = null,
	params  = {},
) => {
	return new Promise(function(resolve, reject) {
		getMasterInstance(sdk, name, relayer)
		.then(instance => {
			deployContract(sdk, "Proxy", [ instance.address, sdk.transactions.prepare.initialization(name, args) ])
			.then(proxy => {
				resolve(viewContract(sdk, name, proxy.address));
			})
			.catch(reject);
		})
		.catch(reject);
	});
}



module.exports = {
  deployContract
, getMasterInstance
, deployProxy
, viewContract
}
