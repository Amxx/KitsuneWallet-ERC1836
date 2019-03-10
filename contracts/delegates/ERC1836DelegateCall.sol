pragma solidity ^0.5.0;

import "../ERC1836DelegateBase.sol";

contract ERC1836DelegateCall is ERC1836DelegateBase
{
	uint256 constant OPERATION_CALL   = 0;
	uint256 constant OPERATION_CREATE = 1;

	event ContractCreated(address indexed contractAddress);

	function _execute(uint256 _operationType, address _to, uint256 _value, bytes memory _data)
	internal
	{
		if (_operationType == OPERATION_CALL)
		{
			bool success;
			bytes memory returndata;
			(success, returndata) = _to.call.value(_value)(_data);
			require(success);
		}
		else if (_operationType == OPERATION_CREATE)
		{
			address newContract;
			assembly
			{
				newContract := create(0, add(_data, 0x20), mload(_data))
			}
			emit ContractCreated(newContract);
		}
		else
		{
			// We don't want to spend users gas if parametar is wrong
			revert();
		}
	}
}
