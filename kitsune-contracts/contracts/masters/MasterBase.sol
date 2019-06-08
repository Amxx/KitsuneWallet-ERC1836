pragma solidity ^0.5.0;

import "../common/Core.sol";
import "./IMaster.sol";


contract MasterBase is IMaster, Core
{
	function implementation()
	external view returns (address)
	{
		return _implementation;
	}

	function proxyType()
	external pure returns (uint256)
	{
		return 2;
	}

	function selector()
	external pure returns (bytes4)
	{
		return MASTER_SELECTOR;
	}
}
