pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

import "./ERC725Base.sol";
import "../../interfaces/IERC1271.sol";


contract Multisig is ERC725Base, IERC1271
{
	using ECDSA for bytes32;

	bytes32 constant PURPOSE_MANAGEMENT = 0x0000000000000000000000000000000000000000000000000000000000000001;
	bytes32 constant PURPOSE_ACTION     = 0x0000000000000000000000000000000000000000000000000000000000000002;
	bytes32 constant PURPOSE_SIGN       = 0x0000000000000000000000000000000000000000000000000000000000000004;

	mapping(bytes32 => bytes32) internal _keyPurposes;
	bytes32[]                   internal _activeKeys;
	uint256                     internal _managementKeyCount;
	uint256                     internal _managementThreshold;
	uint256                     internal _actionThreshold;

	event SetKey(bytes32 indexed key, bytes32 indexed previousPurpose, bytes32 indexed newPurpose);
	event ManagementThresholdChange(uint256 previousThreshold, uint256 newThreshold);
	event ActionThresholdChange(uint256 previousThreshold, uint256 newThreshold);

	function initialize(
		bytes32[] memory keys,
		bytes32[] memory purposes,
		uint256          managementThreshold,
		uint256          actionThreshold)
	public onlyInitializing()
	{
		require(keys.length == purposes.length, "key-and-purpose-array-must-have-same-size");
		for (uint256 i = 0; i < keys.length; ++i)
		{
			_setKey(keys[i], purposes[i]);
		}
		require(_managementKeyCount >= managementThreshold, "not-enough-management-keys");
		_managementThreshold = managementThreshold;
		_actionThreshold = actionThreshold;
	}

	function cleanup()
	internal
	{
		// reset memory space
		for (uint256 i = 0; i < _activeKeys.length; ++i)
		{
			delete _keyPurposes[_activeKeys[i]];
		}
		delete _activeKeys;
		delete _managementKeyCount;
		delete _managementThreshold;
		delete _actionThreshold;
	}

	// ACCESSORS
	function controller()
	public view returns(address)
	{
		return address(this);
	}

	function owner()
	public view returns(address)
	{
		return address(this);
	}

	function nonce()
	public view returns (uint256)
	{
		return _nonce;
	}

	function getManagementKeyCount()
	public view returns(uint256)
	{
		return _managementKeyCount;
	}

	function getManagementThreshold()
	public view returns (uint256)
	{
		return _managementThreshold;
	}

	function getActionThreshold()
	public view returns (uint256)
	{
		return _actionThreshold;
	}

	function addrToKey(address addr)
	public pure returns (bytes32)
	{
		return bytes32(uint256(addr));
	}

	// KEYS
	function getActiveKeys()
	public view returns (bytes32[] memory)
	{
		return _activeKeys;
	}

	function getKey(bytes32 key)
	public view returns (bytes32)
	{
		return _keyPurposes[key];
	}

	function getKey(address key)
	public view returns (bytes32)
	{
		return _keyPurposes[addrToKey(key)];
	}

	function keyHasPurpose(bytes32 key, bytes32 purpose)
	public view returns (bool)
	{
		return _keyHasPurpose(key, purpose);
	}

	function keyHasPurpose(bytes32 key, uint256 purpose)
	public view returns (bool)
	{
		return _keyHasPurpose(key, bytes32(purpose));
	}

	function keyHasPurpose(address key, bytes32 purpose)
	public view returns (bool)
	{
		return _keyHasPurpose(addrToKey(key), purpose);
	}

	function keyHasPurpose(address key, uint256 purpose)
	public view returns (bool)
	{
		return _keyHasPurpose(addrToKey(key), bytes32(purpose));
	}

	function setKey(bytes32 key, bytes32 purpose)
	public onlyOwner()
	{
		_setKey(key, purpose);
	}

	function setKey(bytes32 key, uint256 purpose)
	public onlyOwner()
	{
		_setKey(key, bytes32(purpose));
	}

	function setKey(address key, bytes32 purpose)
	public onlyOwner()
	{
		_setKey(addrToKey(key), purpose);
	}

	function setKey(address key, uint256 purpose)
	public onlyOwner()
	{
		_setKey(addrToKey(key), bytes32(purpose));
	}

	function _keyHasPurpose(bytes32 key, bytes32 purpose)
	internal view returns (bool)
	{
		return purpose & ~_keyPurposes[key] == bytes32(0);
	}

	function _setKey(bytes32 key, bytes32 purpose)
	internal
	{
		// Update management key count
		if (PURPOSE_MANAGEMENT & ~_keyPurposes[key] == bytes32(0) && PURPOSE_MANAGEMENT & purpose == bytes32(0))
		{
			--_managementKeyCount;
		}

		if (PURPOSE_MANAGEMENT & _keyPurposes[key] == bytes32(0) && PURPOSE_MANAGEMENT & ~purpose == bytes32(0))
		{
			++_managementKeyCount;
		}

		require(_managementKeyCount >= _managementThreshold, "cannot-remove-critical-management-key");

		// Update list of active keys (add)
		if (_keyPurposes[key] == bytes32(0))
		{
			_activeKeys.push(key);
		}

		// emit event
		emit SetKey(key, _keyPurposes[key], purpose);

		// Set key purpose
		_keyPurposes[key] = purpose;

		// Update list of active keys (rem)
		if (_keyPurposes[key] == bytes32(0))
		{
			for (uint256 i = 0; i < _activeKeys.length; ++i)
			{
				if (_activeKeys[i] == key)
				{
					_activeKeys[i] = _activeKeys[_activeKeys.length - 1];
					delete _activeKeys[_activeKeys.length - 1];
					_activeKeys.length--;
					break;
				}
			}
		}
	}

	function setManagementThreshold(uint256 managementThreshold)
	public onlyOwner()
	{
		require(0 != managementThreshold, "threshold-too-low");
		require(_managementKeyCount >= managementThreshold, "threshold-too-high");
		emit ManagementThresholdChange(_managementThreshold, managementThreshold);
		_managementThreshold = managementThreshold;
	}

	function setActionThreshold(uint256 actionThreshold)
	public onlyOwner()
	{
		require(0 != actionThreshold, "threshold-too-low");
		emit ActionThresholdChange(_actionThreshold, actionThreshold);
		_actionThreshold = actionThreshold;
	}

	// ERC1271 SIGNING
	function isValidSignature(bytes32 data, bytes memory signature)
	public view returns (bool)
	{
		return keyHasPurpose(addrToKey(data.recover(signature)), PURPOSE_SIGN);
	}
}
