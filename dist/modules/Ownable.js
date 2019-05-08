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
var __ModuleBase_1 = require("./__ModuleBase");
var Ownable = (function (_super) {
    __extends(Ownable, _super);
    function Ownable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Ownable.prototype.execute = function (proxy, owner, metatx, config) {
        if (config === void 0) { config = {}; }
        return new Promise(function (resolve, reject) {
            proxy
                .connect(owner)
                .execute(metatx.type || 0, metatx.to, metatx.value || 0, metatx.data || "0x", __assign({}, config.options))
                .then(function (tx) { return tx.wait().then(resolve)["catch"](reject); })["catch"](reject);
        });
    };
    return Ownable;
}(__ModuleBase_1["default"]));
exports.Ownable = Ownable;
//# sourceMappingURL=Ownable.js.map