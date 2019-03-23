const MasterOwnable                  = artifacts.require("MasterOwnable");
const MasterMultisig                 = artifacts.require("MasterMultisig");
const MasterMultisigRefund           = artifacts.require("MasterMultisigRefund");
const MasterMultisigRefundOutOfOrder = artifacts.require("MasterMultisigRefundOutOfOrder");
const TargetContract                 = artifacts.require("TargetContract");

module.exports = async function(deployer, network, accounts)
{
	await deployer.deploy(MasterOwnable);
	await deployer.deploy(MasterMultisig);
	await deployer.deploy(MasterMultisigRefund);
	await deployer.deploy(MasterMultisigRefundOutOfOrder);
	await deployer.deploy(TargetContract);
};
