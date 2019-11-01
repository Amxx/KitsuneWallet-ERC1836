pragma solidity ^0.5.0;


/**
 * @title Restricted
 * @dev Virtual class with modifier to restrict the access of sensitive
 * administration functions (in particular those control the upgrade process)
 */
contract Restricted
{
	/**
	 * @dev Modifier to check whether the `msg.sender` is a controller.
	 */
	modifier restricted()
	{
		require(_isConstructor() || _isController(msg.sender), "access-denied");
		_;
	}

	function _isConstructor()
	internal view returns (bool)
	{
		uint256 size;
		assembly { size := extcodesize(address) }
		return size == 0;
	}

	/**
	 * @dev Returns weither of not an address is a controllers.
	 */
	function _isController(address) internal view returns (bool);
}
