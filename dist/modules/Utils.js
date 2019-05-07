"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const __ModuleBase_1 = require("./__ModuleBase");
class Utils extends __ModuleBase_1.default {
    addrToKey(address) {
        return ethers_1.ethers.utils.hexZeroPad(ethers_1.ethers.utils.hexlify(address), 32).toString().toLowerCase();
    }
}
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map