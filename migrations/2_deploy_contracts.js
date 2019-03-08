const ERC725Delegate = artifacts.require("ERC725Delegate");
const ERC734Delegate = artifacts.require("ERC734Delegate");
const GenericTarget  = artifacts.require("GenericTarget");

module.exports = async function(deployer, network, accounts)
{
	await deployer.deploy(ERC725Delegate);
	await deployer.deploy(ERC734Delegate);
	await deployer.deploy(GenericTarget);
};
