pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

import "./ERC725Base.sol";
import "./MasterBase.sol";
import "../interfaces/IERC1271.sol";


contract MasterKeysBase is ERC725Base, MasterBase, IERC1271
{
	using ECDSA for bytes32;

	bytes32 constant PURPOSE_MANAGEMENT = 0x0000000000000000000000000000000000000000000000000000000000000001;
	bytes32 constant PURPOSE_ACTION     = 0x0000000000000000000000000000000000000000000000000000000000000002;
	bytes32 constant PURPOSE_SIGN       = 0x0000000000000000000000000000000000000000000000000000000000000004;

	mapping(bytes32 => bytes32) internal m_keyPurposes;
	bytes32[]                   internal m_activeKeys;
	uint256                     internal m_managementKeyCount;
	uint256                     internal m_managementThreshold;
	uint256                     internal m_actionThreshold;

	event SetKey(bytes32 indexed key, bytes32 indexed previousPurpose, bytes32 indexed newPurpose);
	event ManagementThresholdChange(uint256 previousThreshold, uint256 newThreshold);
	event ActionThresholdChange(uint256 previousThreshold, uint256 newThreshold);

	function initialize(
		bytes32[] memory _keys,
		bytes32[] memory _purposes,
		uint256          _managementThreshold,
		uint256          _actionThreshold)
	public onlyInitializing()
	{
		require(_keys.length == _purposes.length, "key-and-purpose-array-must-have-same-size");
		for (uint256 i = 0; i < _keys.length; ++i)
		{
			_setKey(_keys[i], _purposes[i]);
		}
		require(m_managementKeyCount >= _managementThreshold, "not-enough-management-keys");
		m_managementThreshold = _managementThreshold;
		m_actionThreshold     = _actionThreshold;
	}

	function updateMaster(address _newMaster, bytes memory _initData, bool _reset)
	public onlyOwner()
	{
		if (_reset)
		{
			// reset memory space
			for (uint256 i = 0; i < m_activeKeys.length; ++i)
			{
				delete m_keyPurposes[m_activeKeys[i]];
			}
			delete m_activeKeys;
			delete m_managementKeyCount;
			delete m_managementThreshold;
			delete m_actionThreshold;
		}
		// setMaster
		setMaster(_newMaster, _initData);
	}

	// ACCESSORS
	function owner()
	public view returns(address)
	{
		return address(this);
	}

	function nonce()
	public view returns (uint256)
	{
		return m_nonce;
	}

	function managementKeyCount()
	public view returns(uint256)
	{
		return m_managementKeyCount;
	}

	function addrToKey(address _addr)
	public pure returns (bytes32)
	{
		return bytes32(uint256(_addr));
	}

	// KEYS
	function getActiveKeys()                               public view returns (bytes32[] memory) { return m_activeKeys; }
	function getKey       (bytes32 _key)                   public view returns (bytes32) { return m_keyPurposes[          _key ]; }
	function getKey       (address _key)                   public view returns (bytes32) { return m_keyPurposes[addrToKey(_key)]; }
	function keyHasPurpose(bytes32 _key, bytes32 _purpose) public view returns (bool) { return _keyHasPurpose(          _key ,         _purpose ); }
	function keyHasPurpose(bytes32 _key, uint256 _purpose) public view returns (bool) { return _keyHasPurpose(          _key , bytes32(_purpose)); }
	function keyHasPurpose(address _key, bytes32 _purpose) public view returns (bool) { return _keyHasPurpose(addrToKey(_key),         _purpose ); }
	function keyHasPurpose(address _key, uint256 _purpose) public view returns (bool) { return _keyHasPurpose(addrToKey(_key), bytes32(_purpose)); }
	function setKey       (bytes32 _key, bytes32 _purpose) public onlyOwner() { _setKey(          _key ,         _purpose ); }
	function setKey       (bytes32 _key, uint256 _purpose) public onlyOwner() { _setKey(          _key , bytes32(_purpose)); }
	function setKey       (address _key, bytes32 _purpose) public onlyOwner() { _setKey(addrToKey(_key),         _purpose ); }
	function setKey       (address _key, uint256 _purpose) public onlyOwner() { _setKey(addrToKey(_key), bytes32(_purpose)); }

	function _keyHasPurpose(bytes32 _key, bytes32 _purpose)
	internal view returns (bool)
	{
		return _purpose & ~m_keyPurposes[_key] == bytes32(0);
	}

	function _setKey(bytes32 _key, bytes32 _purpose)
	internal
	{
		// Update management key count
		if (PURPOSE_MANAGEMENT & ~m_keyPurposes[_key] == bytes32(0) && PURPOSE_MANAGEMENT &  _purpose == bytes32(0)) { --m_managementKeyCount; }
		if (PURPOSE_MANAGEMENT &  m_keyPurposes[_key] == bytes32(0) && PURPOSE_MANAGEMENT & ~_purpose == bytes32(0)) { ++m_managementKeyCount; }
		require(m_managementKeyCount >= m_managementThreshold, "cannot-remove-critical-management-key");

		// Update list of active keys (add)
		if (m_keyPurposes[_key] == bytes32(0))
		{
			m_activeKeys.push(_key);
		}

		// emit event
		emit SetKey(_key, m_keyPurposes[_key], _purpose);

		// Set key purpose
		m_keyPurposes[_key] = _purpose;

		// Update list of active keys (rem)
		if (m_keyPurposes[_key] == bytes32(0))
		{
			for (uint256 i = 0; i < m_activeKeys.length; ++i)
			{
				if (m_activeKeys[i] == _key)
				{
					m_activeKeys[i] = m_activeKeys[m_activeKeys.length - 1];
					delete m_activeKeys[m_activeKeys.length - 1];
					m_activeKeys.length--;
					break;
				}
			}
		}
	}

	// MULTISIG
	function getManagementThreshold() public view returns (uint256) { return m_managementThreshold; }
	function getActionThreshold    () public view returns (uint256) { return m_actionThreshold;     }

	function setManagementThreshold(uint256 _managementThreshold)
	public onlyOwner()
	{
		require(0 != _managementThreshold, "threshold-too-low");
		require(m_managementKeyCount >= _managementThreshold, "threshold-too-high");
		emit ManagementThresholdChange(m_managementThreshold, _managementThreshold);
		m_managementThreshold = _managementThreshold;
	}

	function setActionThreshold(uint256 _actionThreshold)
	public onlyOwner()
	{
		require(0 != _actionThreshold, "threshold-too-low");
		emit ActionThresholdChange(m_actionThreshold, _actionThreshold);
		m_actionThreshold = _actionThreshold;
	}

	// ERC1271 SIGNING
	function isValidSignature(bytes32 _data, bytes memory _signature)
	public view returns (bool)
	{
		return keyHasPurpose(addrToKey(_data.recover(_signature)), PURPOSE_SIGN);
	}
}
