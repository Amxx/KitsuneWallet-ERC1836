pragma solidity ^0.5.0;

import "zos-lib/contracts/upgradeability/BaseUpgradeabilityProxy.sol";

import "../interfaces/IERC897.sol";
import "../tools/Initializable.sol";


/**
 * @title BaseKitsuneProxy
 * @dev Base layer of the kitsune proxy, an upgradeable proxy with
 * initialization control.
 */
contract BaseKitsuneProxy is BaseUpgradeabilityProxy, Initializable
{
	/**
	 * @dev upgrade implementation and performe an initialization callback.
	 * @param _logic address of the new implementation (master)
	 * @param _data Encoded call to the initialization function on the new master
	 */
	function _upgradeToAndInitialize(address _logic, bytes memory _data)
	internal
	{
		require(IERC897(_logic).implementation() == address(0), "invalid-master-implementation");
		_upgradeTo(_logic);
		if (_data.length > 0)
		{
			_unlock();
			// solium-disable-next-line security/no-low-level-calls
			(bool success,) = _logic.delegatecall(_data);
			require(success, "failed-to-initialize");
		}
	}
}
