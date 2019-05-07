"use strict";
exports.__esModule = true;
var ethers_1 = require("ethers");
// import Proxy                          from "../build-minified/Proxy";
// import WalletOwnable                  from "../build-minified/WalletOwnable";
// import WalletMultisig                 from "../build-minified/WalletMultisig";
// import WalletMultisigRefund           from "../build-minified/WalletMultisigRefund";
// import WalletMultisigRefundOutOfOrder from "../build-minified/WalletMultisigRefundOutOfOrder";
var ABIS = {
    'Proxy': require("../build-minified/Proxy"),
    'WalletOwnable': require("../build-minified/WalletOwnable"),
    'WalletMultisig': require("../build-minified/WalletMultisig"),
    'WalletMultisigRefund': require("../build-minified/WalletMultisigRefund"),
    'WalletMultisigRefundOutOfOrder': require("../build-minified/WalletMultisigRefundOutOfOrder")
};
var Contracts_1 = require("./modules/Contracts");
var Meta_1 = require("./modules/Meta");
var Multisig_1 = require("./modules/Multisig");
var Ownable_1 = require("./modules/Ownable");
var Transactions_1 = require("./modules/Transactions");
var Utils_1 = require("./modules/Utils");
var SDK = /** @class */ (function () {
    function SDK(provider, wallet) {
        if (provider === void 0) { provider = null; }
        if (wallet === void 0) { wallet = null; }
        this.provider = provider || new ethers_1.ethers.providers.JsonRpcProvider();
        this.wallet = wallet;
        this.ABIS = ABIS;
        this.contracts = new Contracts_1.Contracts(this);
        this.meta = new Meta_1.Meta(this);
        this.multisig = new Multisig_1.Multisig(this);
        this.ownable = new Ownable_1.Ownable(this);
        this.transactions = new Transactions_1.Transactions(this);
        this.utils = new Utils_1.Utils(this);
    }
    return SDK;
}());
exports.SDK = SDK;
