pragma solidity ^0.5.0;

import "./ERC725.sol";


contract Recovery is ERC725
{
	uint256 _recoveryLastUsage;
	uint256 _recoveryTimer;
	bytes32 _recoveryHash;

	modifier onlyRecovery(bytes memory recoveryKey)
	{
		require(_recoveryHash == keccak256(recoveryKey), "invalid-recovery-key");
		require(_recoveryLastUsage + _recoveryTimer <= now, "invalid-recovery-timmer"); // TODO: check overflow
		_;
	}

	function _initializeRecovery(bytes32 recoveryHash)
	internal
	{
		_recoveryLastUsage = now;
		_recoveryTimer = 365 days;
		_recoveryHash = recoveryHash;
	}

	function _resetRecovery()
	internal
	{
		delete _recoveryLastUsage;
		delete _recoveryHash;
		delete _recoveryTimer;
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
}
