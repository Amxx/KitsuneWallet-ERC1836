import { ethers } from 'ethers';
import * as types from "./types";

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
import { Execute      } from "./modules/Execute";
import { Meta         } from "./modules/Meta";
import { Transactions } from "./modules/Transactions";
import { Utils        } from "./modules/Utils";

export class SDK
{
	provider: types.provider;
	wallet:   types.wallet;
	ABIS:     object;

	// modules
	contracts:    Contracts;
	execute:      Execute;
	meta:         Meta;
	transactions: Transactions;
	utils:        Utils;

	constructor(
		provider: types.provider = null,
		wallet:   types.wallet = null)
	{
		this.provider = provider || new ethers.providers.JsonRpcProvider();
		this.wallet   = wallet;
		this.ABIS     = ABIS;

		this.contracts    = new Contracts(this);
		this.execute      = new Execute(this);
		this.meta         = new Meta(this);
		this.transactions = new Transactions(this);
		this.utils        = new Utils(this);
	}
}