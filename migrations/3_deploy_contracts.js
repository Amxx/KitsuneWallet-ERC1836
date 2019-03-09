const ERC1836Delegate_Basic          = artifacts.require("ERC1836Delegate_Basic");
const ERC1836Delegate_Multisig       = artifacts.require("ERC1836Delegate_Multisig");
const ERC1836Delegate_MultisigRefund = artifacts.require("ERC1836Delegate_MultisigRefund");
const TargetContract                 = artifacts.require("TargetContract");

module.exports = async function(deployer, network, accounts)
{
	await deployer.deploy(ERC1836Delegate_Basic);
	await deployer.deploy(ERC1836Delegate_Multisig);
	await deployer.deploy(ERC1836Delegate_MultisigRefund);
	await deployer.deploy(TargetContract);
};
