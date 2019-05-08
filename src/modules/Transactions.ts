import { ethers } from 'ethers';
import * as types from "../typings/all";

import ModuleBase from "./__ModuleBase";

var IMaster = require(`../../build-minified/IMaster`);

export class Transactions extends ModuleBase
{
	initialization(
		name: string,
		args: types.ethereum.args,
	) : types.ethereum.bytes {
		return new ethers.utils.Interface(this.sdk.ABIS[name].abi).functions.initialize.encode(args);
	}

	updateMaster(
		name: string,
		data: types.ethereum.bytes,
		config: types.config = {},
	) : Promise<{}> {
		return new Promise((resolve, reject) => {
			this.sdk.contracts.getMasterInstance(name, config)
			.then((instance: types.contract) => {
				resolve(new ethers.utils.Interface(IMaster.abi).functions.updateMaster.encode([
					instance.address,
					data,
					(config.proxyReset !== undefined) ? config.proxyReset : data !== "0x",
				]));
			})
			.catch(reject);
		});
	}
}
