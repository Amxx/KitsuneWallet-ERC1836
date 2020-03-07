pragma solidity ^0.6.0;

import "../zos-upgradeability/BaseUpgradeabilityProxy.sol";
import "../interfaces/IERC897.sol";


/**
 * @title KitsuneProxy
 * @dev constructible version of the kitsune proxy
 */
contract KitsuneProxy is BaseUpgradeabilityProxy
{
	constructor(address logic, bytes memory data)
	public payable
	{
		// TODO: Necessary for now, remove to rely on the check inside the logic
		require(IERC897(logic).implementation() == address(0), "invalid-master-implementation");
		// Setup by the master
		(bool success, bytes memory reason) = logic.delegatecall(abi.encodeWithSignature(
			"updateImplementation(address,bytes,bool)",
			logic,
			data,
			false
		));
		require(success, string(reason));
	}
}
