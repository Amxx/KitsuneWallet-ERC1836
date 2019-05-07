"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const __ModuleBase_1 = require("./__ModuleBase");
var IMaster = require(`../../build-minified/IMaster`);
class Transactions extends __ModuleBase_1.default {
    initialization(name, args) {
        return new ethers_1.ethers.utils.Interface(this.sdk.ABIS[name].abi).functions.initialize.encode(args);
    }
    updateMaster(name, data, config = {}) {
        return new Promise((resolve, reject) => {
            this.sdk.contracts.getMasterInstance(name, config)
                .then((instance) => {
                resolve(new ethers_1.ethers.utils.Interface(IMaster.abi).functions.updateMaster.encode([
                    instance.address,
                    data,
                    (config.proxyReset !== undefined) ? config.proxyReset : data !== "0x",
                ]));
            })
                .catch(reject);
        });
    }
}
exports.Transactions = Transactions;
//# sourceMappingURL=Transactions.js.map