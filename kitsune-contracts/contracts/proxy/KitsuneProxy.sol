pragma solidity ^0.5.0;

import "./BaseKitsuneProxy.sol";


/**
 * @title KitsuneProxy
 * @dev constructible version of the kitsune proxy
 */
contract KitsuneProxy is BaseKitsuneProxy
{
	constructor(address _logic, bytes memory _data)
	public payable
	{
		_upgradeToAndInitialize(_logic, _data);
	}
}
