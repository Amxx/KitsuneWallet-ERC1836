pragma solidity ^0.6.0;

import "../../interfaces/IERC725.sol";
import "../MasterBase.sol";


abstract contract ERC725 is MasterBase, IERC725
{
	bytes32 internal constant PUBLIC_SALT = 0xe81b6d741516190638e87536ee75908b2ec23b41de96d1ec3b6dcc71a09901ef;

	uint256 internal constant OPERATION_CALL   = 0;
	uint256 internal constant OPERATION_CREATE = 1;

	modifier onlyOwner()
	{
		require(msg.sender == owner(), "access-denied");
		_;
	}

	function getData(bytes32 key)
	public override view returns (bytes32)
	{
		return _get(keccak256(abi.encode(PUBLIC_SALT, key)));
	}

	function setData(bytes32 key, bytes32 value)
	public override onlyOwner()
	{
		_set(keccak256(abi.encode(PUBLIC_SALT, key)), value);
		emit DataChanged(key, value);
	}

	function execute(
		uint256 operationType,
		address to,
		uint256 value,
		bytes memory data)
	public virtual override onlyOwner()
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
	internal virtual
	{
		if (operationType == OPERATION_CALL)
		{
			bool success;
			bytes memory returndata;
			uint256 gas = gasleft();
			// solium-disable-next-line security/no-call-value
			(success, returndata) = to.call.value(value)(data);
			// Don't revert if call reverted, just log the failure
			if (success)
			{
				emit CallSuccess(to);
			}
			else
			{
				// Check gas: https://ronan.eth.link/blog/ethereum-gas-dangers/
				assert(gasleft() > gas / 63); // no need for safemath here
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
