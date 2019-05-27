pragma solidity ^0.5.0;

import "../../interfaces/IERC725.sol";
import "../../common/Core.sol";


contract ERC725Base is IERC725, Core
{
	uint256 constant OPERATION_CALL   = 0;
	uint256 constant OPERATION_CREATE = 1;

	modifier onlyOwner()
	{
		require(msg.sender == owner(), "access-denied");
		_;
	}

	// Need this to handle deposit call forwarded by the proxy
	function () external payable {}

	function getData(bytes32 key)
	public view returns (bytes memory)
	{
		return _store[key];
	}

	function setData(bytes32 key, bytes memory value)
	public onlyOwner()
	{
		_store[key] = value;
		emit DataChanged(key, value);
	}

	function execute(
		uint256 operationType,
		address to,
		uint256 value,
		bytes memory data)
	public onlyOwner()
	{
		_execute(
			operationType,
			to,
			value,
			data
		);
	}

	function _execute(
		uint256 operationType,
		address to,
		uint256 value,
		bytes memory data)
	internal
	{
		if (operationType == OPERATION_CALL)
		{
			bool success;
			bytes memory returndata;
			// solium-disable-next-line security/no-call-value
			(success, returndata) = to.call.value(value)(data);
			// Don't revert if call reverted, just log the failure
			if (success)
			{
				emit CallSuccess(to);
			}
			else
			{
				emit CallFailure(to, returndata);
			}
		}
		else if (operationType == OPERATION_CREATE)
		{
			address newContract;
			// solium-disable-next-line security/no-inline-assembly
			assembly
			{
				newContract := create(0, add(data, 0x20), mload(data))
			}
			emit ContractCreated(newContract);
		}
		else
		{
			revert("invalid-operation-type");
		}
	}
}
