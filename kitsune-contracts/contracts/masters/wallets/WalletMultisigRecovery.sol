pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./WalletMultisig.sol";


contract WalletMultisigRecovery is WalletMultisig
{
	uint256 _recoveryLastUsage;
	uint256 _recoveryTimer;
	bytes32 _recoveryHash;

	// This is a delegate contract, lock it
	constructor()
	public
	{
	}

	function initialize(
		bytes32[] memory keys,
		bytes32[] memory purposes,
		uint256          managementThreshold,
		uint256          actionThreshold)
	public onlyInitializing()
	{
		_recoveryLastUsage = now;
		_recoveryTimer = 365 days;
		super.initialize(
			keys,
			purposes,
			managementThreshold,
			actionThreshold
		);
	}

	function updateMaster(address newMaster, bytes memory initData, bool reset)
	public onlyOwner()
	{
		if (reset)
		{
			delete _recoveryLastUsage;
			delete _recoveryHash;
			delete _recoveryTimer;
		}
		super.updateMaster(
			newMaster,
			initData,
			reset
		);
	}

	function getRecoveryLastUsage()
	external view returns (uint256)
	{
		return _recoveryLastUsage;
	}

	function getRecoveryTimer()
	external view returns (uint256)
	{
		return _recoveryTimer;
	}

	function getRecoveryHash()
	external view returns (bytes32)
	{
		return _recoveryHash;
	}

	function setRecoveryHash(bytes32 recoveryHash)
	external onlyOwner()
	{
		_recoveryHash = recoveryHash;
	}

	function setRecoveryTimer(uint256 recoveryTimer)
	external onlyOwner()
	{
		_recoveryTimer = recoveryTimer;
	}

	function _execute(
		uint256      operationType,
		address      to,
		uint256      value,
		bytes memory data)
	internal
	{
		_recoveryLastUsage = now;
		super._execute(
			operationType,
			to,
			value,
			data
		);
	}

	function recovery(bytes memory recoveryKey, address newMaster, bytes memory initData)
	public
	{
		// check recoverykey
		require(_recoveryHash == keccak256(recoveryKey), "invalid-recovery-key");
		// check timmer
		require(_recoveryLastUsage + _recoveryTimer <= now, "invalid-recovery-timmer"); // TODO: check overflow
		// call will pass ownership protection
		this.updateMaster(newMaster, initData, true);
	}
}
