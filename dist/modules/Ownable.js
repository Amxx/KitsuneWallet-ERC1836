"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __ModuleBase_1 = require("./__ModuleBase");
class Ownable extends __ModuleBase_1.default {
    execute(owner, proxy, metatx, config = {}) {
        return new Promise((resolve, reject) => {
            proxy
                .connect(owner)
                .execute(metatx.type || 0, metatx.to, metatx.value || 0, metatx.data || "0x", Object.assign({}, config.options)) // TRANSACTION 
                .then((tx) => tx.wait().then(resolve).catch(reject))
                .catch(reject);
        });
    }
}
exports.Ownable = Ownable;
//# sourceMappingURL=Ownable.js.map