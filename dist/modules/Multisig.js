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
var Multisig = /** @class */ (function (_super) {
    __extends(Multisig, _super);
    function Multisig() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Multisig.prototype.setKey = function (proxy, key, purpose, signers, config) {
        if (config === void 0) { config = {}; }
        return this.sdk.execute.multisig(signers, proxy, {
            to: proxy.address,
            data: proxy.interface.functions['setKey(bytes32,bytes32)'].encode([key, purpose])
        }, config = {});
    };
    return Multisig;
}(__ModuleBase_1["default"]));
exports.Multisig = Multisig;
