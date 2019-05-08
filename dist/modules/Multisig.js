"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var ethers_1 = require("ethers");
var __ModuleBase_1 = require("./__ModuleBase");
var Meta_1 = require("./Meta");
function toNumber(n) {
    switch (typeof n) {
        case 'number':
            return n;
            break;
        case 'string':
            return Number(n);
            break;
        default:
            return n.toNumber();
            break;
    }
}
;
var Multisig = (function (_super) {
    __extends(Multisig, _super);
    function Multisig() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Multisig.prototype.sign = function (proxy, signers, metatx) {
        var executeABI = Object.keys(proxy.interface.functions).filter(function (fn) { return fn.startsWith("execute(") && fn !== 'execute(uint256,address,uint256,bytes)'; })[0];
        return new Promise(function (resolve, reject) {
            proxy.nonce()
                .then(function (previousNonce) {
                var txFull = Meta_1.PREPARE_TX[executeABI](__assign({ nonce: toNumber(previousNonce) + 1 }, metatx));
                var txHash = ethers_1.ethers.utils.arrayify(Meta_1.HASHING_METATX[executeABI](proxy.address, txFull));
                Promise.all(signers.sort(function (a, b) { return (a.address == b.address) ? 0 : (a.address > b.address) ? 1 : -1; }).map(function (signer) { return signer.signMessage(txHash); }))
                    .then(function (signatures) {
                    resolve({ to: proxy.address, data: proxy.interface.functions[executeABI].encode(Meta_1.INLINE_TX[executeABI](txFull).concat([signatures])) });
                })["catch"](reject);
            })["catch"](reject);
        });
    };
    Multisig.prototype.relay = function (tx, config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        return new Promise(function (resolve, reject) {
            (config.wallet || _this.sdk.wallet || reject(Error("Missing wallet")))
                .sendTransaction(__assign({}, config.options, tx))
                .then(resolve)["catch"](reject);
        });
    };
    Multisig.prototype.execute = function (proxy, signers, metatx, config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        return new Promise(function (resolve, reject) {
            _this.sign(proxy, signers, metatx)
                .then(function (signed_metatx) {
                _this.relay(signed_metatx, config)
                    .then(resolve)["catch"](reject);
            })["catch"](reject);
        });
    };
    Multisig.prototype.setKey = function (proxy, signers, key, purpose, config) {
        if (config === void 0) { config = {}; }
        return this.execute(proxy, signers, {
            to: proxy.address,
            data: proxy.interface.functions['setKey(bytes32,bytes32)'].encode([key, purpose])
        }, config);
    };
    return Multisig;
}(__ModuleBase_1["default"]));
exports.Multisig = Multisig;
//# sourceMappingURL=Multisig.js.map