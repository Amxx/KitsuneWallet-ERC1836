import { ethers } from 'ethers';
import * as types from "../types";

import ModuleBase from "./__ModuleBase";

var IMaster = require(`../../build-minified/IMaster`);

export class Transactions extends ModuleBase
{
	initialization(
		name: string,
		args: types.args,
	) : string
	{
		return new ethers.utils.Interface(this.sdk.ABIS[name].abi).functions.initialize.encode(args);
	}

	updateMaster(
		name: string,
		data: string,
		config: types.config = {},
	) : Promise<{}>
	{
		return new Promise((resolve, reject) => {
			this.sdk.contracts.getMasterInstance(name, config)
			.then(instance => {
				resolve(new ethers.utils.Interface(IMaster.abi).functions.updateMaster.encode([
					instance.address,
					data,
					(config['reset'] !== undefined) ? config['reset'] : data !== "0x",
				]));
			})
			.catch(reject);
		});
	}
}
