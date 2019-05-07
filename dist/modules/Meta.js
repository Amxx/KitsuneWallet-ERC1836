"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
exports.HASHING_METATX = {
    'execute(uint256,address,uint256,bytes,uint256,bytes[])': (proxyAddress, tx) => {
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
    'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': (proxyAddress, tx) => {
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
    'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': (proxyAddress, tx) => {
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
    },
};
exports.PREPARE_TX = {
    'execute(uint256,address,uint256,bytes,uint256,bytes[])': (tx) => {
        return Object.assign({ type: 0, value: 0, data: "0x" }, tx);
    },
    'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': (tx) => {
        return Object.assign({ type: 0, value: 0, data: "0x", gasToken: "0x0000000000000000000000000000000000000000", gasPrice: 0 }, tx);
    },
    'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': (tx) => {
        return Object.assign({ type: 0, value: 0, data: "0x", gasToken: "0x0000000000000000000000000000000000000000", gasPrice: 0, salt: ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.randomBytes(32)) }, tx);
    },
};
exports.INLINE_TX = {
    'execute(uint256,address,uint256,bytes,uint256,bytes[])': (tx) => {
        return [tx.type, tx.to, tx.value, tx.data, tx.nonce];
    },
    'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': (tx) => {
        return [tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.gasToken, tx.gasPrice];
    },
    'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': (tx) => {
        return [tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.salt, tx.gasToken, tx.gasPrice];
    },
};
//# sourceMappingURL=Meta.js.map