pragma solidity ^0.5.0;

import "zos-lib/contracts/upgradeability/BaseUpgradeabilityProxy.sol";

import "../interfaces/IERC897.sol";
import "./IMaster.sol";
import "../tools/Initializable.sol";
import "../tools/Restricted.sol";


/**
 * @title MasterBase
 * @dev This contract the base kitsune's masters.
 */
contract MasterBase is IMaster, BaseUpgradeabilityProxy, Initializable, Restricted
{
	/**
	 * @dev Enpty fallback function (should not delegate further).
	 */
	function () external payable {}

	/**
	 * @dev IERC897 implementation
	 * @return address of the implementation (non null if called from a proxy)
	 */
	function implementation()
	external view returns (address)
	{
		return _implementation();
	}

	/**
	 * @dev IERC897 proxyType
	 * @return description of the proxyType as per IERC897
	 */
	function proxyType()
	external pure returns (uint256)
	{
		return 2;
	}

	/**
	 * @dev Accessor to the controller (for auditability purposes).
	 * @return address of the controller
	 */
	function controller()
	external view returns (address)
	{
		return _controller();
	}

	/**
	 * @dev Accessor to the initialized status (for auditability purposes).
	 * @return value of the initialized flag
	 */
	function initialized()
	external view returns (bool)
	{
		return _initialized();
	}

	/**
	 * @dev kitsune wallet's upgrade process with optional reset by the old master.
	 * @param logic new master to use
	 * @param data callback to initialize the proxy using the new master
	 * @param reset flag used to trigger the reset of the proxy by the old master
	 */
	function updateImplementation(address logic, bytes calldata data, bool reset)
	external restricted()
	{
		require(IERC897(logic).implementation() == address(0), "invalid-master-implementation");
		if (reset)
		{
			cleanup();
		}
		_upgradeTo(logic);
		if (data.length > 0)
		{
			_unlock();
			// solium-disable-next-line security/no-low-level-calls
			(bool success, bytes memory reason) = logic.delegatecall(data);
			require(success, string(reason));
		}
	}

	/**
	 * @dev cleanup up method to overide (revert by default).
	 */
	function cleanup()
	internal
	{
		revert("cleanup-not-implemented");
	}

}
