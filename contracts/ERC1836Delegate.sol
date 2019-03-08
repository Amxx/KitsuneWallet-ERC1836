pragma solidity ^0.5.5;

import "./ERC1836.sol";

contract ERC1836Delegate is ERC1836
{
	uint256 constant OPERATION_CALL   = 0;
	uint256 constant OPERATION_CREATE = 1;

	event ContractCreated(address indexed contractAddress);

	// params may vary
	// must be initialization
	// function initialize(...) external initialization;

	// must cleanup state before calling setDelegate
	// must be protected
	function updateDelegate(address,bytes calldata) external /*protected*/;

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
