pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "../../ENS/ENSRegistered.sol";
import "../MasterBase.sol";
import "../MasterKeysBase.sol";


contract WalletMultisig is MasterBase, MasterKeysBase, ENSRegistered
{
	// This is a delegate contract, lock it
	constructor()
	public
	{
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

		this.execute(_operationType, _to, _value, _data);
	}

}
