const { ethers }           = require('ethers');
const contracts            = require('./contracts.js');
const transactions_prepare = require('./transactions-prepare.js');
const transactions_meta    = require('./transactions-meta.js');
const multisig             = require('./multisig.js');
const utils                = require('./utils.js');

const ABIS = {
	"Proxy":                          require(`../build-minified/Proxy`),
	"WalletOwnable":                  require(`../build-minified/WalletOwnable`),
	"WalletMultisig":                 require(`../build-minified/WalletMultisig`),
	"WalletMultisigRefund":           require(`../build-minified/WalletMultisigRefund`),
	"WalletMultisigRefundOutOfOrder": require(`../build-minified/WalletMultisigRefundOutOfOrder`),
}

class Sdk
{
	constructor(provider = null, defaultRelayer = null)
	{
		this.provider       = provider || new ethers.providers.JsonRpcProvider();
		this.defaultRelayer = defaultRelayer;

		this.contracts =
		{
			ABIS:              ABIS,
			deployContract:    contracts.deployContract.bind(this, this),
			getMasterInstance: contracts.getMasterInstance.bind(this, this),
			deployProxy:       contracts.deployProxy.bind(this, this),
			viewContract:      contracts.viewContract.bind(this, this),
		};

		this.transactions =
		{
			prepare:
			{
				initialization: transactions_prepare.initialization.bind(this, this),
				updateMaster:   transactions_prepare.updateMaster,
			},
			relay:            transactions_meta.relay.bind(this, this),
			sign:             transactions_meta.sign,
		};

		this.multisig =
		{
			setKey:           multisig.setKey.bind(this, this),
		};

		this.utils =
		{
			addrToKey:        utils.addrToKey,
		};
	}
}


module.exports = { Sdk };
