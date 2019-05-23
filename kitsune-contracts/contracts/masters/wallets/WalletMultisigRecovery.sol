pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./WalletMultisig.sol";


contract WalletMultisigRecovery is WalletMultisig
{
	uint256 public recoveryLastUsage;
	uint256 public recoveryTimer;
	bytes32 public recoveryHash;

	// This is a delegate contract, lock it
	constructor()
	public
	{
	}

	function initialize(
		bytes32[] memory _keys,
		bytes32[] memory _purposes,
		uint256          _managementThreshold,
		uint256          _actionThreshold)
	public onlyInitializing()
	{
		recoveryLastUsage = now;
		recoveryTimer     = 365 days;
		super.initialize(_keys, _purposes, _managementThreshold, _actionThreshold);
	}

	function updateMaster(address _newMaster, bytes memory _initData, bool _reset)
	public onlyOwner()
	{
		if (_reset)
		{
			delete recoveryLastUsage;
			delete recoveryHash;
			delete recoveryTimer;
		}
		super.updateMaster(_newMaster, _initData, _reset);
	}

	function _execute(uint256 _operationType, address _to, uint256 _value, bytes memory _data)
	internal
	{
		recoveryLastUsage = now;
		super._execute(_operationType, _to, _value, _data);
	}

	function recovery(bytes memory _recovery, address _newMaster, bytes memory _initData)
	public
	{
		// check recoverykey
		require(recoveryHash == keccak256(_recovery), "invalid-recovery-key");
		// check timmer
		require(recoveryLastUsage + recoveryTimer <= now, "invalid-recovery-timmer"); // TODO: check overflow
		// call will pass ownership protection
		this.updateMaster(_newMaster, _initData, true);
	}

	function setRecoveryHash(bytes32 _hash)
	external onlyOwner()
	{
		recoveryHash = _hash;
	}

	function setRecoveryTimer(uint256 _duration)
	external onlyOwner()
	{
		recoveryTimer = _duration;
	}

}
