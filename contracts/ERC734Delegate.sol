pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "./ERC1xxxDelegate.sol";
import "./ECDSA.sol";

contract ERC734Delegate is ERC1xxxDelegate, ECDSA
{
	bytes32 constant PURPOSE_MANAGEMENT = 0x0000000000000000000000000000000000000000000000000000000000000001;
	bytes32 constant PURPOSE_ACTION     = 0x0000000000000000000000000000000000000000000000000000000000000002;

	mapping(bytes32 => bytes32) m_keyPurposes;
	bytes32[]                   m_activeKeys;
	uint256                     m_nonce;
	uint256                     m_managementTreshold;
	uint256                     m_actionTreshold;

	// This is a delegate contract, lock it
	constructor()
	public
	ERC1xxx(address(0), bytes(""))
	{
	}

	function initialize(
		bytes32[] calldata _keys,
		bytes32[] calldata _purposes,
		uint256            _managementThreshold,
		uint256            _actionThreshold)
	external initialization
	{
		require(_keys.length == _purposes.length);
		uint256 countManagement = 0;
		for (uint256 i = 0; i < _keys.length; ++i)
		{
			_setKey(_keys[i], _purposes[i]);
			if (PURPOSE_MANAGEMENT & ~_purposes[i] == bytes32(0))
			{
				++countManagement;
			}
		}
		require(countManagement >= _managementThreshold);
		m_managementTreshold = _managementThreshold;
		m_actionTreshold     = _actionThreshold;
	}

	function updateDelegate(address _newDelegate, bytes calldata _callback)
	external protected
	{
		// reset memory space
		for (uint256 i = 0; i < m_activeKeys.length; ++i)
		{
			delete m_keyPurposes[m_activeKeys[i]];
		}
		delete m_activeKeys;
		delete m_nonce;
		delete m_managementTreshold;
		delete m_actionTreshold;

		// set next delegate
		setDelegate(_newDelegate, _callback);
	}

	function addrToKey(address addr)
	public
	pure
	returns (bytes32)
	{
		return keccak256(abi.encodePacked(addr));
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

	function execute
	( uint256        _operationType
	, address        _to
	, uint256        _value
	, bytes   memory _data
	, uint256        _nonce
	, bytes[] memory _sigs
	)
	public
	{
		++m_nonce;
		require(_nonce == m_nonce, "invalid-nonce");

		bytes32 neededPurpose;
		if (_to == address(this))
		{
			require(_sigs.length >= m_managementTreshold, "missing-signers");
			neededPurpose = PURPOSE_MANAGEMENT;
		}
		else
		{
			require(_sigs.length >= m_actionTreshold, "missing-signers");
			neededPurpose = PURPOSE_ACTION;
		}

		bytes32 executionID = toEthSignedMessageHash(keccak256(abi.encode(
				address(this),
				_operationType,
				_to,
				_value,
				_data,
				_nonce
			)));

		for (uint256 i = 0; i < _sigs.length; ++i)
		{
			require(keyHasPurpose(addrToKey(recover(executionID, _sigs[i])), neededPurpose), "invalid-signature");
		}

		_execute(_operationType, _to, _value, _data);
	}

}
