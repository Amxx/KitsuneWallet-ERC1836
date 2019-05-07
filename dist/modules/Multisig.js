"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const Meta_1 = require("./Meta");
const __ModuleBase_1 = require("./__ModuleBase");
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
class Multisig extends __ModuleBase_1.default {
    sign(proxy, signers, metatx) {
        var executeABI = Object.keys(proxy.interface.functions).filter(fn => fn.startsWith("execute(") && fn !== 'execute(uint256,address,uint256,bytes)')[0];
        return new Promise(function (resolve, reject) {
            proxy.nonce()
                .then((previousNonce) => {
                var txFull = Meta_1.PREPARE_TX[executeABI](Object.assign({ nonce: toNumber(previousNonce) + 1 }, metatx));
                var txHash = ethers_1.ethers.utils.arrayify(Meta_1.HASHING_METATX[executeABI](proxy.address, txFull));
                Promise.all(signers.sort((a, b) => (a.address == b.address) ? 0 : (a.address > b.address) ? 1 : -1).map(signer => signer.signMessage(txHash)))
                    .then(signatures => {
                    resolve({ to: proxy.address, data: proxy.interface.functions[executeABI].encode([...Meta_1.INLINE_TX[executeABI](txFull), signatures]) });
                })
                    .catch(reject);
            })
                .catch(reject);
        });
    }
    relay(tx, config = {}) {
        return new Promise((resolve, reject) => {
            (config.wallet || this.sdk.wallet || reject(Error("Missing wallet")))
                .sendTransaction(Object.assign({}, config.options, tx)) // TRANSACTION
                .then(resolve)
                .catch(reject);
        });
    }
    execute(proxy, signers, metatx, config = {}) {
        return new Promise((resolve, reject) => {
            this.sign(proxy, signers, metatx)
                .then((signed_metatx) => {
                this.relay(signed_metatx, config)
                    .then(resolve)
                    .catch(reject);
            })
                .catch(reject);
        });
    }
    setKey(proxy, signers, key, purpose, config = {}) {
        return this.execute(proxy, signers, {
            to: proxy.address,
            data: proxy.interface.functions['setKey(bytes32,bytes32)'].encode([key, purpose]),
        }, config);
    }
}
exports.Multisig = Multisig;
//# sourceMappingURL=Multisig.js.map