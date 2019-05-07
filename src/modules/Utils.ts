import { ethers } from 'ethers';
import * as types from "../types/all";

import ModuleBase from "./__ModuleBase";

export class Utils extends ModuleBase
{
	addrToKey(
		address: types.ethereum.address,
	) : types.ethereum.bytes32 {
		return ethers.utils.hexZeroPad(ethers.utils.hexlify(address), 32).toString().toLowerCase();
	}
}
