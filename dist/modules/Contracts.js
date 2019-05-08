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
var Contracts = (function (_super) {
    __extends(Contracts, _super);
    function Contracts() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Contracts.prototype.viewContract = function (name, address) {
        return new ethers_1.ethers.Contract(ethers_1.ethers.utils.hexlify(address), this.sdk.ABIS[name].abi, this.sdk.provider);
    };
    Contracts.prototype.deployContract = function (name, args, config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        return new Promise(function (resolve, reject) {
            var _a;
            (_a = (new ethers_1.ethers.ContractFactory(_this.sdk.ABIS[name].abi, _this.sdk.ABIS[name].bytecode, config.wallet || _this.sdk.wallet || reject(Error("Missing wallet"))))).deploy.apply(_a, args).then(function (instance) { return instance.deployed().then(resolve)["catch"](reject); })["catch"](reject);
        });
    };
    Contracts.prototype.getMasterInstance = function (name, config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        return new Promise(function (resolve, reject) {
            _this.sdk.provider.getNetwork()
                .then(function (network) {
                try {
                    resolve(_this.viewContract(name, _this.sdk.ABIS[name].networks[network.chainId].address));
                }
                catch (_a) {
                    if (config.allowDeploy) {
                        _this.deployContract(name, [], config)
                            .then(function (instance) {
                            _this.sdk.ABIS[name].networks[network.chainId] = {
                                "events": {},
                                "links": {},
                                "address": instance.address,
                                "transactionHash": instance.deployTransaction.hash
                            };
                            resolve(instance);
                        })["catch"](reject);
                    }
                    else {
                        reject(Error("Master is not available on this network, try setting config.allowDeploy to true"));
                    }
                }
            })["catch"](reject);
        });
    };
    Contracts.prototype.deployProxy = function (name, args, config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        return new Promise(function (resolve, reject) {
            _this.getMasterInstance(name, config)
                .then(function (instance) {
                _this.deployContract("Proxy", [instance.address, _this.sdk.transactions.initialization(name, args)])
                    .then(function (proxy) { return resolve(_this.viewContract(name, proxy.address)); })["catch"](reject);
            })["catch"](reject);
        });
    };
    Contracts.prototype.upgradeProxy = function (proxy, name, args, execute, config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        return new Promise(function (resolve, reject) {
            _this.sdk.transactions.updateMaster(name, args ? _this.sdk.transactions.initialization(name, args) : "0x", config)
                .then(function (initData) {
                execute(proxy, { to: proxy.address, data: initData }, config)
                    .then(function () {
                    proxy = _this.viewContract(name, proxy.address);
                    resolve(proxy);
                })["catch"](reject);
            })["catch"](reject);
        });
    };
    return Contracts;
}(__ModuleBase_1["default"]));
exports.Contracts = Contracts;
//# sourceMappingURL=Contracts.js.map