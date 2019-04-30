pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

import "../ERC725Base.sol";
import "../MasterBase.sol";
import "../../interfaces/IERC1271.sol";
import "../../ENS/ENSRegistered.sol";


contract IexecWhitelist is ERC725Base, MasterBase, IERC1271, ENSRegistered
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

	function owner()
	external view returns(address)
	{
		return address(this);
	}

	function nonce()
	public view returns (uint256)
	{
		return m_nonce;
	}

	function managementKeyCount()
	external view returns(uint256)
	{
		return m_managementKeyCount;
	}

	function initialize(
		bytes32[] calldata _keys,
		bytes32[] calldata _purposes,
		uint256            _managementThreshold,
		uint256            _actionThreshold)
	external onlyInitializing
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

	function updateMaster(address _newMaster, bytes calldata _initData, bool _reset)
	external protected
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

	// SIGNING
	function addrToKey(address addr)
	public pure returns (bytes32)
	{
		return keccak256(abi.encode(addr));
	}

	function isValidSignature(bytes32 _data, bytes memory _signature)
	public view returns (bool)
	{
		return keyHasPurpose(addrToKey(_data.recover(_signature)), PURPOSE_SIGN);
	}

	// KEY VIEW
	function getKey(bytes32 _key)
	public view returns (bytes32)
	{
		return m_keyPurposes[_key];
	}

	function getActiveKeys()
	public view returns (bytes32[] memory)
	{
		return m_activeKeys;
	}

	function keyHasPurpose(bytes32 _key, bytes32 _purpose)
	public view returns (bool)
	{
		return _purpose & ~m_keyPurposes[_key] == bytes32(0);
	}

	function keyHasPurpose(bytes32 _key, uint256 _purpose)
	public view returns (bool)
	{
		return keyHasPurpose(_key, bytes32(_purpose));
	}

	// KEY UPDATE
	function setKey(bytes32 _key, bytes32 _purpose)
	public protected
	{
		_setKey(_key, _purpose);
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
		require(0 != _managementThreshold, "threshold-too-low");
		require(m_managementKeyCount >= _managementThreshold, "threshold-too-high");
		emit ManagementThresholdChange(m_managementThreshold, _managementThreshold);
		m_managementThreshold = _managementThreshold;
	}

	function setActionThreshold(uint256 _actionThreshold)
	external protected
	{
		require(0 != _actionThreshold, "threshold-too-low");
		emit ActionThresholdChange(m_actionThreshold, _actionThreshold);
		m_actionThreshold = _actionThreshold;
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
		require(++m_nonce == _nonce, "invalid-nonce");

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

		bytes32 executionID = keccak256(abi.encodePacked(
				address(this),
				_operationType,
				_to,
				_value,
				keccak256(_data),
				_nonce
			)).toEthSignedMessageHash();

		address lastSigner = address(0);
		for (uint256 i = 0; i < _sigs.length; ++i)
		{
			address signer  = executionID.recover(_sigs[i]);
			require(signer > lastSigner, "invalid-signatures-ordering");
			require(keyHasPurpose(addrToKey(signer), neededPurpose), "invalid-signature");
			lastSigner = signer;
		}

		this.execute(_operationType, _to, _value, _data);
	}
}
