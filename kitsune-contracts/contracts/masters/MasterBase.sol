pragma solidity ^0.5.0;

import "../interfaces/IERC897.sol";
import "../common/Core.sol";


contract MasterBase is Core, IERC897
{
	function implementation()
	external view returns (address)
	{
		return _implementation;
	}

	function contractType()
	external pure returns (bytes32)
	{
		return IMPLEMENTATION_ID;
	}

	function proxyType()
	external pure returns (uint256)
	{
		return 2;
	}

	function updateImplementation(address,bytes calldata,bool)
		external;
}
