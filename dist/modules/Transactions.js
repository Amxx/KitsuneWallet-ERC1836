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
exports.__esModule = true;
var ethers_1 = require("ethers");
var __ModuleBase_1 = require("./__ModuleBase");
var IMaster = require("../../build-minified/IMaster");
var Transactions = /** @class */ (function (_super) {
    __extends(Transactions, _super);
    function Transactions() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Transactions.prototype.initialization = function (name, args) {
        return new ethers_1.ethers.utils.Interface(this.sdk.ABIS[name].abi).functions.initialize.encode(args);
    };
    Transactions.prototype.updateMaster = function (name, data, config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        return new Promise(function (resolve, reject) {
            _this.sdk.contracts.getMasterInstance(name, config)
                .then(function (instance) {
                resolve(new ethers_1.ethers.utils.Interface(IMaster.abi).functions.updateMaster.encode([
                    instance.address,
                    data,
                    (config['reset'] !== undefined) ? config['reset'] : data !== "0x",
                ]));
            })["catch"](reject);
        });
    };
    return Transactions;
}(__ModuleBase_1["default"]));
exports.Transactions = Transactions;
