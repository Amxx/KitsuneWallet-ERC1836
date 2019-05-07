const { ethers } = require('ethers');

const throwIfMissing = () => {
	throw Error('Missing parameter');
};

const addrToKey = (address) => {
	return ethers.utils.hexZeroPad(address, 32).toString().toLowerCase();
};

module.exports = {
	throwIfMissing,
	addrToKey,
}
