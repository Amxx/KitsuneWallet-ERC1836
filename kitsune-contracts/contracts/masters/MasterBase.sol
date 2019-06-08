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

	function updateImplementation(address,bytes calldata,bool)
		external;
}
