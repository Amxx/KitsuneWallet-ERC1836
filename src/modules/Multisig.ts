import { ethers } from 'ethers';
import * as types from "../types";

import ModuleBase from "./__ModuleBase";

export class Multisig extends ModuleBase
{
	setKey(
		proxy:   types.contract,
		key:     string,
		purpose: string,
		signers: types.wallet[],
		config:  types.config = {},
	) : Promise<{}>
	{
		return this.sdk.execute.multisig(
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
