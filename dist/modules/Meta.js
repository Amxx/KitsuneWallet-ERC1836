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
var HASHING_METATX = {
    'execute(uint256,address,uint256,bytes,uint256,bytes[])': function (proxyAddress, tx) {
        return ethers_1.ethers.utils.solidityKeccak256([
            'address',
            'uint256',
            'address',
            'uint256',
            'bytes32',
            'uint256',
        ], [
            proxyAddress,
            tx.type,
            tx.to,
            tx.value,
            ethers_1.ethers.utils.keccak256(tx.data),
            tx.nonce,
        ]);
    },
    'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': function (proxyAddress, tx) {
        return ethers_1.ethers.utils.solidityKeccak256([
            'address',
            'uint256',
            'address',
            'uint256',
            'bytes32',
            'uint256',
            'address',
            'uint256',
        ], [
            proxyAddress,
            tx.type,
            tx.to,
            tx.value,
            ethers_1.ethers.utils.keccak256(tx.data),
            tx.nonce,
            tx.gasToken,
            tx.gasPrice,
        ]);
    },
    'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': function (proxyAddress, tx) {
        return ethers_1.ethers.utils.solidityKeccak256([
            'address',
            'uint256',
            'address',
            'uint256',
            'bytes32',
            'uint256',
            'bytes32',
            'address',
            'uint256',
        ], [
            proxyAddress,
            tx.type,
            tx.to,
            tx.value,
            ethers_1.ethers.utils.keccak256(tx.data),
            tx.nonce,
            tx.salt,
            tx.gasToken,
            tx.gasPrice,
        ]);
    }
};
var PREPARE_TX = {
    'execute(uint256,address,uint256,bytes,uint256,bytes[])': function (tx) {
        return __assign({ type: 0, value: 0, data: [] }, tx);
    },
    'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': function (tx) {
        return __assign({ type: 0, value: 0, data: [], gasToken: "0x0000000000000000000000000000000000000000", gasPrice: 0 }, tx);
    },
    'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': function (tx) {
        return __assign({ type: 0, value: 0, data: [], gasToken: "0x0000000000000000000000000000000000000000", gasPrice: 0, salt: ethers_1.ethers.utils.randomBytes(32) }, tx);
    }
};
var INLINE_TX = {
    'execute(uint256,address,uint256,bytes,uint256,bytes[])': function (tx) {
        return [tx.type, tx.to, tx.value, tx.data, tx.nonce];
    },
    'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': function (tx) {
        return [tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.gasToken, tx.gasPrice];
    },
    'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': function (tx) {
        return [tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.salt, tx.gasToken, tx.gasPrice];
    }
};
var Meta = /** @class */ (function (_super) {
    __extends(Meta, _super);
    function Meta() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Meta.prototype.sign = function (proxy, tx, signers) {
        var executeABI = Object.keys(proxy.interface.functions).filter(function (fn) { return fn.startsWith("execute(") && fn !== 'execute(uint256,address,uint256,bytes)'; })[0];
        return new Promise(function (resolve, reject) {
            proxy.nonce()
                .then(function (previousNonce) {
                var txFull = PREPARE_TX[executeABI](__assign({ nonce: previousNonce.toNumber() + 1 }, tx));
                var txHash = ethers_1.ethers.utils.arrayify(HASHING_METATX[executeABI](proxy.address, txFull));
                Promise.all(signers.sort(function (a, b) { return (a.address == b.address) ? 0 : (a.address > b.address) ? 1 : -1; }).map(function (signer) { return signer.signMessage(txHash); }))
                    .then(function (signatures) {
                    resolve({ to: proxy.address, data: proxy.interface.functions[executeABI].encode(INLINE_TX[executeABI](txFull).concat([signatures])) });
                })["catch"](reject);
            })["catch"](reject);
        });
    };
    Meta.prototype.relay = function (tx, config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        return new Promise(function (resolve, reject) {
            (config['wallet'] || _this.sdk.wallet || reject(Error("Missing wallet")))
                .sendTransaction(__assign({}, tx, { gasLimit: 1000000 }, config['params']))
                .then(resolve)["catch"](reject);
        });
    };
    return Meta;
}(__ModuleBase_1["default"]));
exports.Meta = Meta;
