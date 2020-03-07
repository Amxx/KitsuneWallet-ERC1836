pragma solidity ^0.6.0;

import "../MasterBase.sol";


abstract contract MasterCore is MasterBase
{
	/**
	 * @dev IERC897 implementation
	 * @return address of the implementation (non null if called from a proxy)
	 */
	function implementation()
	external override view returns (address)
	{
		return _implementation();
	}

	/**
	 * @dev IERC897 proxyType
	 * @return description of the proxyType as per IERC897
	 */
	function proxyType()
	external override pure returns (uint256)
	{
		return 2;
	}

	/**
	 * @dev Accessor to the controller (for auditability purposes).
	 * @return address of the controller
	 */
	function isController(address _controller)
	external override view returns (bool)
	{
		return _isController(_controller);
	}

	/**
	 * @dev Accessor to the initialized status (for auditability purposes).
	 * @return value of the initialized flag
	 */
	function isInitialized()
	external override view returns (bool)
	{
		return _isInitialized();
	}

	/**
	 * @dev kitsune wallet's upgrade process with optional reset by the old master.
	 * @param logic new master to use
	 * @param data callback to initialize the proxy using the new master
	 * @param reset flag used to trigger the reset of the proxy by the old master
	 */
	function updateImplementation(address logic, bytes calldata data, bool reset)
	external override restricted()
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
}
