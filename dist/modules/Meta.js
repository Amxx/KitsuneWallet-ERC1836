"use strict";
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
exports.HASHING_METATX = {
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
exports.PREPARE_TX = {
    'execute(uint256,address,uint256,bytes,uint256,bytes[])': function (tx) { return __assign({ type: 0, value: 0, data: "0x" }, tx); },
    'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': function (tx) { return __assign({ type: 0, value: 0, data: "0x", gasToken: ethers_1.ethers.constants.AddressZero, gasPrice: 0 }, tx); },
    'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': function (tx) { return __assign({ type: 0, value: 0, data: "0x", gasToken: ethers_1.ethers.constants.AddressZero, gasPrice: 0, salt: ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.randomBytes(32)) }, tx); }
};
exports.INLINE_TX = {
    'execute(uint256,address,uint256,bytes,uint256,bytes[])': function (tx) { return [tx.type, tx.to, tx.value, tx.data, tx.nonce]; },
    'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': function (tx) { return [tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.gasToken, tx.gasPrice]; },
    'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': function (tx) { return [tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.salt, tx.gasToken, tx.gasPrice]; }
};
//# sourceMappingURL=Meta.js.map