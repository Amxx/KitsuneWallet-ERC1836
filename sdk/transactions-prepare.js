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
	args = throwIfMissing(),
) => {
	return new ethers.utils.Interface(IMaster.abi).functions.updateMaster.encode(args);
}

module.exports = {
	initialization,
	updateMaster,
}
