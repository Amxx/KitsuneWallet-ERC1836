"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const __ModuleBase_1 = require("./__ModuleBase");
class Contracts extends __ModuleBase_1.default {
    viewContract(name, address) {
        return new ethers_1.ethers.Contract(ethers_1.ethers.utils.hexlify(address), this.sdk.ABIS[name].abi, this.sdk.provider);
    }
    deployContract(name, args, config = {}) {
        return new Promise((resolve, reject) => {
            (new ethers_1.ethers.ContractFactory(this.sdk.ABIS[name].abi, this.sdk.ABIS[name].bytecode, config.wallet || this.sdk.wallet || reject(Error("Missing wallet"))))
                .deploy(...args) // TRANSACTION
                .then(instance => instance.deployed().then(resolve).catch(reject))
                .catch(reject);
        });
    }
    getMasterInstance(name, config = {}) {
        return new Promise((resolve, reject) => {
            this.sdk.provider.getNetwork()
                .then((network) => {
                try {
                    resolve(this.viewContract(name, this.sdk.ABIS[name].networks[network.chainId].address));
                }
                catch (_a) {
                    if (config.allowDeploy) {
                        this.deployContract(name, [], config)
                            .then(instance => {
                            this.sdk.ABIS[name].networks[network.chainId] = {
                                "events": {},
                                "links": {},
                                "address": instance.address,
                                "transactionHash": instance.deployTransaction.hash
                            };
                            resolve(instance);
                        })
                            .catch(reject);
                    }
                    else {
                        reject(Error("Master is not available on this network, try setting config.allowDeploy to true"));
                    }
                }
            })
                .catch(reject);
        });
    }
    deployProxy(name, args, config = {}) {
        return new Promise((resolve, reject) => {
            this.getMasterInstance(name, config)
                .then((instance) => {
                this.deployContract("Proxy", [instance.address, this.sdk.transactions.initialization(name, args)])
                    .then(proxy => resolve(this.viewContract(name, proxy.address)))
                    .catch(reject);
            })
                .catch(reject);
        });
    }
    upgradeProxy(proxy, name, args, execute, config = {}) {
        return new Promise((resolve, reject) => {
            this.sdk.transactions.updateMaster(name, args ? this.sdk.transactions.initialization(name, args) : "0x", config)
                .then((initData) => {
                execute(proxy, { to: proxy.address, data: initData }, config)
                    .then(() => {
                    proxy = this.viewContract(name, proxy.address);
                    resolve(proxy);
                })
                    .catch(reject);
            })
                .catch(reject);
        });
    }
}
exports.Contracts = Contracts;
//# sourceMappingURL=Contracts.js.map