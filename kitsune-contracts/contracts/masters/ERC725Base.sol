pragma solidity ^0.5.0;

import "../interfaces/IERC725.sol";
import "../common/Core.sol";


contract ERC725Base is IERC725, Core
{
	uint256 constant OPERATION_CALL   = 0;
	uint256 constant OPERATION_CREATE = 1;

	modifier onlyOwner()
	{
		require(msg.sender == owner(), 'access-denied');
		_;
	}

	// Need this to handle deposit call forwarded by the proxy
	function () external payable {}

	function getData(bytes32 _key)
	public view returns (bytes memory)
	{
		return m_store[_key];
	}

	function setData(bytes32 _key, bytes memory _value)
	public onlyOwner()
	{
		m_store[_key] = _value;
		emit DataChanged(_key, _value);
	}

	function execute(uint256 _operationType, address _to, uint256 _value, bytes memory _data)
	public onlyOwner()
	{
		_execute(_operationType, _to, _value, _data);
	}

	function _execute(uint256 _operationType, address _to, uint256 _value, bytes memory _data)
	internal
	{
		if (_operationType == OPERATION_CALL)
		{
			bool success;
			bytes memory returndata;
			(success, returndata) = _to.call.value(_value)(_data);
			// Don't revert if call reverted, just log the failure
			// require(success, string(returndata));
			if (success)
			{
				emit CallSuccess(_to);
			}
			else
			{
				emit CallFailure(_to, returndata);
				// emit CallFailure(_to, string(returndata));
			}
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
			revert('invalid-operation-type');
		}
	}
}
