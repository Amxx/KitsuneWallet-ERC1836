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
var Ownable = /** @class */ (function (_super) {
    __extends(Ownable, _super);
    function Ownable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Ownable.prototype.execute = function (owner, proxy, tx, config) {
        if (config === void 0) { config = {}; }
        return new Promise(function (resolve, reject) {
            proxy
                .connect(owner)
                .execute(tx['type'] || 0, tx['to'], tx['value'] || 0, tx['data'] || "0x", { gasLimit: 800000 })
                .then(function (tx) { return tx.wait().then(resolve)["catch"](reject); })["catch"](reject);
        });
    };
    return Ownable;
}(__ModuleBase_1["default"]));
exports.Ownable = Ownable;
