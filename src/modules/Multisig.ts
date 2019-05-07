import { ethers } from 'ethers';
import * as types from "../types";

import ModuleBase from "./__ModuleBase";

export class Multisig extends ModuleBase
{
	execute(
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

	setKey(
		proxy:   types.contract,
		key:     string,
		purpose: string,
		signers: types.wallet[],
		config:  types.config = {},
	) : Promise<{}>
	{
		return this.execute(
			signers,
			proxy,
			{
				to: proxy.address,
				data: proxy.interface.functions['setKey(bytes32,bytes32)'].encode([ key, purpose ]),
			},
			config = {},
		);
	}
}
