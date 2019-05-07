const { ethers }         = require('ethers');
const { throwIfMissing } = require('./utils.js');

const IMaster = require(`../build-minified/IMaster`);

const initialization = (
	sdk  = throwIfMissing(),
	name = throwIfMissing(),
	args = throwIfMissing(),
) => {
	return new ethers.utils.Interface(sdk.contracts.ABIS[name].abi).functions.initialize.encode(args);
}

const updateMaster = (
	sdk          = throwIfMissing(),
	name         = throwIfMissing(),
	initTx       = throwIfMissing(),
	reset        = null,
	deployMaster = true,
	relayer      = null,
) => {
	return new Promise((resolve, reject) => {
		sdk.contracts.getMasterInstance(name, deployMaster, relayer)
		.then(instance => {
			if (instance === null)
			{
				reject(null);
			}
			resolve(new ethers.utils.Interface(IMaster.abi).functions.updateMaster.encode([
				instance.address,
				initTx,
				(reset !== null) ? reset : initTx !== "0x",
			]));
		})
		.catch(reject);
	});
}

module.exports = {
	initialization,
	updateMaster,
}
