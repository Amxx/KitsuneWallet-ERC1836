const ERC1836Delegate_Ownable        = artifacts.require("ERC1836Delegate_Ownable");
const ERC1836Delegate_Multisig       = artifacts.require("ERC1836Delegate_Multisig");
const ERC1836Delegate_MultisigRefund = artifacts.require("ERC1836Delegate_MultisigRefund");
const TargetContract                 = artifacts.require("TargetContract");

module.exports = async function(deployer, network, accounts)
{
	await deployer.deploy(ERC1836Delegate_Ownable);
	await deployer.deploy(ERC1836Delegate_Multisig);
	await deployer.deploy(ERC1836Delegate_MultisigRefund);
	await deployer.deploy(TargetContract);
};
