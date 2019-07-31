pragma solidity ^0.5.0;


/**
 * @title Restricted
 * @dev Virtual class with modifier to restrict the access of sensitive
 * administration functions (in particular those control the upgrade process)
 */
contract Restricted
{
	/**
	 * @dev Modifier to check whether the `msg.sender` is the controller.
	 */
	modifier restricted()
	{
		require(isConstructor() || msg.sender == _controller(), "access-denied");
		_;
	}

	function isConstructor()
	internal view returns (bool)
	{
		uint256 size;
		assembly { size := extcodesize(address) }
		return size == 0;
	}

	/**
	 * @dev Returns the current controller (virtual).
	 * @return Address of the current controller
	 */
	function _controller() internal view returns (address);
}
