pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "../../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../node_modules/openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

import "../ENSRegistered.sol";
import "../interfaces/IERC1271.sol";

import "./ERC1836DelegateCall.sol";

contract ERC1836Delegate_Multisig is ERC1836DelegateCall, ENSRegistered, IERC1271
{
	using SafeMath for uint256;
	using ECDSA    for bytes32;

	bytes32 constant PURPOSE_MANAGEMENT = 0x0000000000000000000000000000000000000000000000000000000000000001;
	bytes32 constant PURPOSE_ACTION     = 0x0000000000000000000000000000000000000000000000000000000000000002;
	bytes32 constant PURPOSE_SIGN       = 0x0000000000000000000000000000000000000000000000000000000000000004;

	mapping(bytes32 => bytes32) m_keyPurposes;
	bytes32[]                   m_activeKeys;
	uint256                     m_nonce;
	uint256                     m_managementThreshold;
	uint256                     m_actionThreshold;

	// This is a delegate contract, lock it
	constructor()
	public
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
		m_managementThreshold = _managementThreshold;
		m_actionThreshold     = _actionThreshold;
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
		delete m_managementThreshold;
		delete m_actionThreshold;

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
		require(_nonce == 0 || _nonce == nonce(), "invalid-nonce");

		bytes32 neededPurpose;
		if (_to == address(this))
		{
			require(_sigs.length >= m_managementThreshold, "missing-signers");
			neededPurpose = PURPOSE_MANAGEMENT;
		}
		else
		{
			require(_sigs.length >= m_actionThreshold, "missing-signers");
			neededPurpose = PURPOSE_ACTION;
		}

		bytes32 executionID = keccak256(abi.encode(
				address(this),
				_operationType,
				_to,
				_value,
				keccak256(_data),
				_nonce
			)).toEthSignedMessageHash();

		for (uint256 i = 0; i < _sigs.length; ++i)
		{
			require(keyHasPurpose(addrToKey(executionID.recover(_sigs[i])), neededPurpose), "invalid-signature");
		}

		_execute(_operationType, _to, _value, _data);
	}

	function isValidSignature(bytes32 _data, bytes memory _signature)
	public view returns (bool)
	{
		return keyHasPurpose(addrToKey(_data.recover(_signature)), PURPOSE_SIGN);
	}

}
