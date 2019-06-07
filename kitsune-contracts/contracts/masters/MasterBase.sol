pragma solidity ^0.5.0;

import "./IMaster.sol";
import "../interfaces/IERC897.sol";
import "../common/Core.sol";


contract MasterBase is IMaster, IERC897, Core
{
	function implementation()
	external view returns (address)
	{
		return _implementation;
	}

	function implementationId()
	external pure returns (bytes32)
	{
		return MASTER_ID;
	}

	function proxyType()
	external pure returns (uint256)
	{
		return 2;
	}
}
