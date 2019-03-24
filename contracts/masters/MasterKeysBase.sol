pragma solidity ^0.5.0;

import "../../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../node_modules/openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

import "../common/Storage.sol";
import "../interfaces/IERC1271.sol";


contract MasterKeysBase is Storage, IERC1271
{
	using SafeMath for uint256;
	using ECDSA    for bytes32;

	bytes32 constant PURPOSE_MANAGEMENT = 0x0000000000000000000000000000000000000000000000000000000000000001;
	bytes32 constant PURPOSE_ACTION     = 0x0000000000000000000000000000000000000000000000000000000000000002;
	bytes32 constant PURPOSE_SIGN       = 0x0000000000000000000000000000000000000000000000000000000000000004;

	mapping(bytes32 => bytes32) internal m_keyPurposes;
	bytes32[]                   internal m_activeKeys;
	uint256                     internal m_managementKeyCount;
	uint256                     internal m_managementThreshold;
	uint256                     internal m_actionThreshold;

	function initialize(
		bytes32[] calldata _keys,
		bytes32[] calldata _purposes,
		uint256            _managementThreshold,
		uint256            _actionThreshold)
	external initialization
	{
		require(_keys.length == _purposes.length, "key-and-purpose-array-must-have-same-size");
		m_managementKeyCount = 0;
		for (uint256 i = 0; i < _keys.length; ++i)
		{
			_setKey(_keys[i], _purposes[i]);
			if (PURPOSE_MANAGEMENT & ~_purposes[i] == bytes32(0))
			{
				++m_managementKeyCount;
			}
		}
		require(m_managementKeyCount >= _managementThreshold, "not-enough-management-keys");
		m_managementThreshold = _managementThreshold;
		m_actionThreshold     = _actionThreshold;
	}

	function updateMaster(address _newMaster, bytes calldata _callback)
	external protected
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

		// set next Master
		setMaster(_newMaster, _callback);
	}

	function addrToKey(address addr)
	public pure returns (bytes32)
	{
		return keccak256(abi.encodePacked(addr));
	}

	function nonce()
	public view returns (uint256)
	{
		return m_nonce;
	}

	function getKey(bytes32 _key)
	public view returns (bytes32)
	{
		return m_keyPurposes[_key];
	}

	function keyHasPurpose(bytes32 _key, bytes32 _purpose)
	public view returns (bool)
	{
		return _purpose & ~m_keyPurposes[_key] == bytes32(0);
	}

	function setKey(bytes32 _key, bytes32 _purpose)
	public protected
	{
		_setKey(_key, _purpose);
	}

	function _setKey(bytes32 _key, bytes32 _purpose)
	internal
	{
		if (PURPOSE_MANAGEMENT & ~m_keyPurposes[_key] == bytes32(0) && PURPOSE_MANAGEMENT &  _purpose == bytes32(0)) { --m_managementKeyCount; }
		if (PURPOSE_MANAGEMENT &  m_keyPurposes[_key] == bytes32(0) && PURPOSE_MANAGEMENT & ~_purpose == bytes32(0)) { ++m_managementKeyCount; }
		require(m_managementKeyCount >= m_managementThreshold, "cannot-remove-critical-management-key");

		if (m_keyPurposes[_key] == bytes32(0))
		{
			m_activeKeys.push(_key);
		}

		m_keyPurposes[_key] = _purpose;

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

	function getManagementThreshold()
	external view returns (uint256)
	{
		return m_managementThreshold;
	}
	function getActionThreshold()
	external view returns (uint256)
	{
		return m_actionThreshold;
	}

	function setManagementThreshold(uint256 _managementThreshold)
	external protected
	{
		require(m_managementKeyCount >= _managementThreshold, "threshold-to-high");
		m_managementThreshold = _managementThreshold;
	}

	function setActionThreshold(uint256 _actionThreshold)
	external protected
	{
		m_actionThreshold = _actionThreshold;
	}

	function isValidSignature(bytes32 _data, bytes memory _signature)
	public view returns (bool)
	{
		return keyHasPurpose(addrToKey(_data.recover(_signature)), PURPOSE_SIGN);
	}

}
