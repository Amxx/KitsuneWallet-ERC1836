pragma solidity ^0.5.0;


/**
 * @title Controlled
 * @dev Virtual class with modifier to restrict the access of sensitive
 * administration functions (in particular those control the upgrade process)
 */
contract Controlled
{
	/**
	 * @dev Modifier to check whether the `msg.sender` is the controller.
	 */
	modifier onlyController()
	{
		require(msg.sender == _controller(), "access-denied");
		_;
	}

	/**
	 * @dev Returns the current controller (virtual).
	 * @return Address of the current controller
	 */
	function _controller() internal view returns (address);
}
