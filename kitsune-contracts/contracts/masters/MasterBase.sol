pragma solidity ^0.5.0;

import "../proxy/BaseKitsuneProxy.sol";

import "./IMaster.sol";
import "../tools/Controlled.sol";


/**
 * @title MasterBase
 * @dev This contract the base kitsune's masters.
 */
contract MasterBase is IMaster, BaseKitsuneProxy, Controlled
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
	 * @dev kitsune wallet's upgrade process with optional reset by the old master.
	 * @param logic new master to use
	 * @param data callback to initialize the proxy using the new master
	 * @param reset flag used to trigger the reset of the proxy by the old master
	 */
	function updateImplementation(address logic, bytes calldata data, bool reset)
	external onlyController()
	{
		if (reset)
		{
			cleanup();
		}
		_upgradeToAndInitialize(logic, data);
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
