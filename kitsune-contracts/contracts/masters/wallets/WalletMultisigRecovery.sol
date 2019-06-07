pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./WalletMultisig.sol";
import "../modules/Recovery.sol";


contract WalletMultisigRecovery is WalletMultisig, Recovery
{
	function initialize(
		bytes32[] memory keys,
		bytes32[] memory purposes,
		uint256          managementThreshold,
		uint256          actionThreshold,
		bytes32          recoveryHash)
	public onlyInitializing()
	{
		_initializeRecovery(recoveryHash);
		super.initialize(
			keys,
			purposes,
			managementThreshold,
			actionThreshold
		);
	}

	function initialize(
		bytes32[] memory keys,
		bytes32[] memory purposes,
		uint256          managementThreshold,
		uint256          actionThreshold)
	public onlyInitializing()
	{
		initialize(
			keys,
			purposes,
			managementThreshold,
			actionThreshold,
			bytes32(0)
		);
	}

	function updateImplementation(address newImplementation, bytes memory initializationData, bool reset)
	public onlyOwner()
	{
		if (reset)
		{
			_resetRecovery();
		}
		super.updateImplementation(
			newImplementation,
			initializationData,
			reset
		);
	}

	function recovery(bytes memory recoveryKey, address newImplementation, bytes memory initializationData)
	public onlyRecovery(recoveryKey)
	{
		this.updateImplementation(newImplementation, initializationData, true);
	}
}
