import { ethers } from 'ethers';
import * as types from "../types";

import ModuleBase from "./__ModuleBase";

export class Execute extends ModuleBase
{
	ownable(
		owner:  types.wallet,
		proxy:  types.contract,
		tx:     {},
		config: types.config = {},
	) : Promise<{}>
	{
		return new Promise((resolve, reject) => {
			proxy
			.connect(owner)
			.execute(tx['type'] || 0, tx['to'], tx['value'] || 0, tx['data'] || "0x", { gasLimit: 800000 })
			.then(tx => tx.wait().then(resolve).catch(reject))
			.catch(reject);
		});
	}

	multisig(
		signers: types.wallet[],
		proxy:   types.contract,
		tx:      {},
		config:  types.config = {},
	) : Promise<{}>
	{
		return new Promise((resolve, reject) => {
			this.sdk.meta.sign(proxy, tx, signers)
			.then(metatx => {
				this.sdk.meta.relay(metatx, config)
				.then(resolve)
				.catch(reject);
			})
			.catch(reject);
		});
	}
}
