const WalletOwnable                  = artifacts.require("WalletOwnable");
const WalletMultisig                 = artifacts.require("WalletMultisig");
const WalletMultisigRefund           = artifacts.require("WalletMultisigRefund");
const WalletMultisigRefundOutOfOrder = artifacts.require("WalletMultisigRefundOutOfOrder");
const Target                         = artifacts.require("Target");

module.exports = async function(deployer, network, accounts)
{
	await deployer.deploy(WalletOwnable);
	await deployer.deploy(WalletMultisig);
	await deployer.deploy(WalletMultisigRefund);
	await deployer.deploy(WalletMultisigRefundOutOfOrder);
	await deployer.deploy(Target);
};
