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
var __ModuleBase_1 = require("./__ModuleBase");
var Execute = /** @class */ (function (_super) {
    __extends(Execute, _super);
    function Execute() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Execute.prototype.ownable = function (owner, proxy, tx, config) {
        if (config === void 0) { config = {}; }
        return new Promise(function (resolve, reject) {
            proxy
                .connect(owner)
                .execute(tx['type'] || 0, tx['to'], tx['value'] || 0, tx['data'] || "0x", { gasLimit: 800000 })
                .then(function (tx) { return tx.wait().then(resolve)["catch"](reject); })["catch"](reject);
        });
    };
    Execute.prototype.multisig = function (signers, proxy, tx, config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        return new Promise(function (resolve, reject) {
            _this.sdk.meta.sign(proxy, tx, signers)
                .then(function (metatx) {
                _this.sdk.meta.relay(metatx, config)
                    .then(resolve)["catch"](reject);
            })["catch"](reject);
        });
    };
    return Execute;
}(__ModuleBase_1["default"]));
exports.Execute = Execute;
