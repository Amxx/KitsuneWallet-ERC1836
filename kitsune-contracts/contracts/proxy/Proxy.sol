pragma solidity ^0.5.0;

import "../common/Core.sol";


contract Proxy is Core
{
	constructor(address implementation, bytes memory initializationData)
	public
	{
		setImplementation(implementation, initializationData);
	}

	function selector()
	external pure returns (bytes4)
	{
		return PROXY_SELECTOR;
	}

	function ()
	external payable
	{
		if (_implementation != address(0))
		{
			// solium-disable-next-line security/no-inline-assembly
			assembly
			{
				let to  := and(sload(0x0), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) // _implementation
				let ptr := mload(0x40)
				calldatacopy(ptr, 0, calldatasize)
				let result := delegatecall(gas, to, ptr, calldatasize, 0, 0)
				let size := returndatasize
				returndatacopy(ptr, 0, size)
				switch result
				case 0  { revert (ptr, size) }
				default { return (ptr, size) }
			}
		}
	}
}
