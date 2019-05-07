import { ethers } from 'ethers';
import * as types from "../types";

import ModuleBase from "./__ModuleBase";

export class Utils extends ModuleBase
{
	addrToKey(
		address: string,
	) : string
	{
		return ethers.utils.hexZeroPad(address, 32).toString().toLowerCase();
	}
}
