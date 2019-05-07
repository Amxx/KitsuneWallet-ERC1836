"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
// import Proxy                          from "../build-minified/Proxy";
// import WalletOwnable                  from "../build-minified/WalletOwnable";
// import WalletMultisig                 from "../build-minified/WalletMultisig";
// import WalletMultisigRefund           from "../build-minified/WalletMultisigRefund";
// import WalletMultisigRefundOutOfOrder from "../build-minified/WalletMultisigRefundOutOfOrder";
var ABIS = {
    'Proxy': require(`../build-minified/Proxy`),
    'WalletOwnable': require(`../build-minified/WalletOwnable`),
    'WalletMultisig': require(`../build-minified/WalletMultisig`),
    'WalletMultisigRefund': require(`../build-minified/WalletMultisigRefund`),
    'WalletMultisigRefundOutOfOrder': require(`../build-minified/WalletMultisigRefundOutOfOrder`),
};
const Contracts_1 = require("./modules/Contracts");
const Multisig_1 = require("./modules/Multisig");
const Ownable_1 = require("./modules/Ownable");
const Transactions_1 = require("./modules/Transactions");
const Utils_1 = require("./modules/Utils");
class SDK {
    constructor(provider = null, wallet = null) {
        this.provider = provider || new ethers_1.ethers.providers.JsonRpcProvider();
        this.wallet = wallet;
        this.ABIS = ABIS;
        this.contracts = new Contracts_1.Contracts(this);
        this.multisig = new Multisig_1.Multisig(this);
        this.ownable = new Ownable_1.Ownable(this);
        this.transactions = new Transactions_1.Transactions(this);
        this.utils = new Utils_1.Utils(this);
    }
}
exports.SDK = SDK;
//# sourceMappingURL=SDK.js.map