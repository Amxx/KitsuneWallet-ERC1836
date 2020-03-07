pragma solidity ^0.6.0;


/**
 * @title Context
 * @dev Contains context for modules logic
 */
abstract contract Context
{
	function chainID()
	internal pure returns(uint256 id)
	{
		// assembly { id := chainid() }
		id = 1; // TODO: fix for istanbul !!!
	}
}
