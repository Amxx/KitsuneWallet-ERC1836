import { ethers } from 'ethers';
import * as types from "./typings/all";

// import Proxy                          from "../build-minified/Proxy";
// import WalletOwnable                  from "../build-minified/WalletOwnable";
// import WalletMultisig                 from "../build-minified/WalletMultisig";
// import WalletMultisigRefund           from "../build-minified/WalletMultisigRefund";
// import WalletMultisigRefundOutOfOrder from "../build-minified/WalletMultisigRefundOutOfOrder";

var ABIS = {
	'Proxy':                          require(`../build-minified/Proxy`),
	'WalletOwnable':                  require(`../build-minified/WalletOwnable`),
	'WalletMultisig':                 require(`../build-minified/WalletMultisig`),
	'WalletMultisigRefund':           require(`../build-minified/WalletMultisigRefund`),
	'WalletMultisigRefundOutOfOrder': require(`../build-minified/WalletMultisigRefundOutOfOrder`),
}

import { Contracts    } from "./modules/Contracts";
import { Multisig     } from "./modules/Multisig";
import { Ownable      } from "./modules/Ownable";
import { Transactions } from "./modules/Transactions";
import { Utils        } from "./modules/Utils";

export class SDK
{
	provider: types.provider;
	wallet:   types.wallet;
	ABIS:     object;

	// modules
	contracts:    Contracts;
	multisig:     Multisig;
	ownable:      Ownable;
	transactions: Transactions;
	utils:        Utils;

	constructor(
		provider: types.provider = null,
		wallet:   types.wallet   = null,
	) {
		this.provider = provider || new ethers.providers.JsonRpcProvider();
		this.wallet   = wallet;
		this.ABIS     = ABIS;

		this.contracts    = new Contracts(this);
		this.multisig     = new Multisig(this);
		this.ownable      = new Ownable(this);
		this.transactions = new Transactions(this);
		this.utils        = new Utils(this);
	}
}
