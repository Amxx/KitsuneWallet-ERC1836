pragma solidity ^0.6.0;

import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "../MasterBase.sol";
import "./ERC725.sol";
import "./structs/KeyPurposes.sol";
import "../../interfaces/IERC1271.sol";


abstract contract Multisig is MasterBase, IERC1271, ERC725
{
	using ECDSA       for bytes32;
	using KeyPurposes for KeyPurposes.keypurposes;

	bytes32 internal constant PURPOSE_MANAGEMENT = 0x0000000000000000000000000000000000000000000000000000000000000001;
	bytes32 internal constant PURPOSE_ACTION     = 0x0000000000000000000000000000000000000000000000000000000000000002;
	bytes32 internal constant PURPOSE_SIGN       = 0x0000000000000000000000000000000000000000000000000000000000000004;

	KeyPurposes.keypurposes internal _keyPurposes;
	uint256                 internal _managementThreshold;
	uint256                 internal _actionThreshold;

	event SetKey(bytes32 indexed key, bytes32 indexed previousPurpose, bytes32 indexed newPurpose);
	event ManagementThresholdChange(uint256 previousThreshold, uint256 newThreshold);
	event ActionThresholdChange(uint256 previousThreshold, uint256 newThreshold);

	function initialize(address masterKey)
	public virtual initializer()
	{
		_setKey(addrToKey(masterKey), PURPOSE_MANAGEMENT & PURPOSE_ACTION & PURPOSE_SIGN);

		_setManagementThreshold(1);
		_setActionThreshold(1);
	}

	function initialize(
		bytes32[] memory keys,
		bytes32[] memory purposes,
		uint256          managementThreshold,
		uint256          actionThreshold)
	public virtual initializer()
	{
		require(keys.length == purposes.length, "key-and-purpose-array-must-have-same-size");
		for (uint256 i = 0; i < keys.length; ++i)
		{
			_setKey(keys[i], purposes[i]);
		}
		_setManagementThreshold(managementThreshold);
		_setActionThreshold(actionThreshold);
	}

	function cleanup()
	internal virtual override
	{
		_keyPurposes.clear();
		delete _managementThreshold;
		delete _actionThreshold;
	}

	function _isController(address _controller)
	internal override view returns (bool)
	{
		return _controller == address(this);
	}

	// ACCESSORS
	function owner()
	public override view returns(address)
	{
		return address(this);
	}

	function nonce()
	public view returns (uint256)
	{
		return _getNonce();
	}

	function getManagementKeyCount()
	public view returns(uint256)
	{
		return _keyPurposes.managers;
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
	function getActiveKeys         ()                             public view returns (bytes32[] memory) { return _keyPurposes.keys();                              }
	function getKey                (bytes32 key)                  public view returns (bytes32)          { return _keyPurposes.value(key);                          }
	function getKey                (address key)                  public view returns (bytes32)          { return _keyPurposes.value(addrToKey(key));               }
	function keyHasPurpose         (bytes32 key, bytes32 purpose) public view returns (bool)             { return _keyHasPurpose(key,            purpose         ); }
	function keyHasPurpose         (bytes32 key, uint256 purpose) public view returns (bool)             { return _keyHasPurpose(key,            bytes32(purpose)); }
	function keyHasPurpose         (address key, bytes32 purpose) public view returns (bool)             { return _keyHasPurpose(addrToKey(key), purpose         ); }
	function keyHasPurpose         (address key, uint256 purpose) public view returns (bool)             { return _keyHasPurpose(addrToKey(key), bytes32(purpose)); }
	function setKey                (bytes32 key, bytes32 purpose) public onlyOwner() { _setKey(key, purpose); }
	function setKey                (bytes32 key, uint256 purpose) public onlyOwner() { _setKey(key, bytes32(purpose)); }
	function setKey                (address key, bytes32 purpose) public onlyOwner() { _setKey(addrToKey(key), purpose); }
	function setKey                (address key, uint256 purpose) public onlyOwner() { _setKey(addrToKey(key), bytes32(purpose)); }
	function setManagementThreshold(uint256 managementThreshold ) public onlyOwner() { _setManagementThreshold(managementThreshold); }
	function setActionThreshold    (uint256 actionThreshold     ) public onlyOwner() { _setActionThreshold(actionThreshold);         }

	/**
	 * Internals
	 */
	function _keyHasPurpose(bytes32 key, bytes32 purpose)
	internal view returns (bool)
	{
		return purpose & ~_keyPurposes.value(key) == bytes32(0);
	}

	function _setKey(bytes32 key, bytes32 purpose)
	internal
	{
		emit SetKey(key, _keyPurposes.value(key), purpose);
		_keyPurposes.setKey(key, purpose);
		require(_keyPurposes.managers >= _managementThreshold, "cannot-remove-critical-management-key");
	}

	function _setManagementThreshold(uint256 managementThreshold)
	internal
	{
		require(0 != managementThreshold, "threshold-too-low");
		require(_keyPurposes.managers >= managementThreshold, "threshold-too-high");
		emit ManagementThresholdChange(_managementThreshold, managementThreshold);
		_managementThreshold = managementThreshold;
	}


	function _setActionThreshold(uint256 actionThreshold)
	internal
	{
		require(0 != actionThreshold, "threshold-too-low");
		emit ActionThresholdChange(_actionThreshold, actionThreshold);
		_actionThreshold = actionThreshold;
	}

	/**
	 * ERC1271 SIGNING
	 */
	function isValidSignature(bytes32 data, bytes memory signature)
	public override view returns (bytes4)
	{
		return _keyHasPurpose(addrToKey(data.recover(signature)), PURPOSE_SIGN) ? MAGICVALUE : bytes4(0);
	}

	/**
	 * @dev Storage slot used as a base for the derivation of keys.
	 * This is the keccak-256 hash of "kitsunewallet.master.keys.nonce".
	 */
	bytes32 internal constant NONCE_KEY = 0xda5e0e02236b874ef3507d3af6a30be0fd3f299f15d6141fe15e5ade0d023e4c;

	function _getNonce()
	internal view returns (uint256)
	{
		return uint256(_get(NONCE_KEY));
	}

	function _setNonce(uint256 _nonce)
	internal
	{
		_set(NONCE_KEY, bytes32(_nonce));
	}

	function _incrNonce()
	internal returns (uint256)
	{
		uint256 newNonce = _getNonce() + 1;
		_setNonce(newNonce);
		return newNonce;
	}
}
