pragma solidity ^0.5.0;

import "./ERC1836.sol";

contract ERC1836Proxy is ERC1836
{
	constructor(address _delegate, bytes memory _initData)
	public
	{
		setDelegate(_delegate, _initData);
	}

	function ()
	external payable
	{
		if (m_delegate != address(0) && msg.sig != bytes4(0))
		{
			assembly
			{
				let to  := and(sload(0x0), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) // m_delegate
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
