const ERC1xxxDelegate_Basic          = artifacts.require("ERC1xxxDelegate_Basic");
const ERC1xxxDelegate_Multisig       = artifacts.require("ERC1xxxDelegate_Multisig");
const ERC1xxxDelegate_MultisigRefund = artifacts.require("ERC1xxxDelegate_MultisigRefund");
const ERC1xxxDelegate_Universal      = artifacts.require("ERC1xxxDelegate_Universal");
const GenericTarget                  = artifacts.require("GenericTarget");

module.exports = async function(deployer, network, accounts)
{
	await deployer.deploy(ERC1xxxDelegate_Basic);
	await deployer.deploy(ERC1xxxDelegate_Multisig);
	await deployer.deploy(ERC1xxxDelegate_MultisigRefund);
	// await deployer.deploy(ERC1xxxDelegate_Universal);
	await deployer.deploy(GenericTarget);
};
