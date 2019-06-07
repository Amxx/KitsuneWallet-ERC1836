import { ethers }  from 'ethers';
import * as types  from "../typings/all";

import ModuleBase  from "./__ModuleBase";

export class Transactions extends ModuleBase
{
	initialization(
		name: string,
		args: types.ethereum.args,
	) : types.ethereum.bytes {
		return new ethers.utils.Interface(this.sdk.ABIS[name].abi).functions.initialize.encode(args);
	}

	updateImplementation(
		name: string,
		data: types.ethereum.bytes,
		config: types.config = {},
	) : Promise<{}> {
		return new Promise((resolve, reject) => {
			this.sdk.contracts.getActiveInstance(name, config)
			.then((instance: types.contract) => {
				resolve(new ethers.utils.Interface(this.sdk.ABIS.IMaster.abi).functions.updateImplementation.encode([
					instance.address,
					data,
					(config.migration !== undefined && config.migration.reset !== undefined) ? config.migration.reset : data !== "0x",
				]));
			})
			.catch(reject);
		});
	}
}
