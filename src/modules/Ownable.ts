import { ethers } from 'ethers';
import * as types from "../types/all";

import ModuleBase from "./__ModuleBase";

export class Ownable extends ModuleBase
{
	execute(
		proxy:  types.contract,
		owner:  types.wallet,
		metatx: types.ethereum.metatx,
		config: types.config = {},
	) : Promise<{}>
	{
		return new Promise((resolve, reject) => {
			proxy
			.connect(owner)
			.execute(metatx.type || 0, metatx.to, metatx.value || 0, metatx.data || "0x", { ...config.options }) // TRANSACTION
			.then((tx: types.ethereum.tx) => tx.wait().then(resolve).catch(reject))
			.catch(reject);
		});
	}
}
