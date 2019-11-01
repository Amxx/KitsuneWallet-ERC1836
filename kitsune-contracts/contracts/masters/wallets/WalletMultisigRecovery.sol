pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./WalletMultisig.sol";
import "../components/Recovery.sol";


contract WalletMultisigRecovery is WalletMultisig, Recovery
{
	function initialize(
		bytes32[] memory keys,
		bytes32[] memory purposes,
		uint256          managementThreshold,
		uint256          actionThreshold,
		bytes32          recoveryHash)
	public initializer()
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
	public initializer()
	{
		initialize(
			keys,
			purposes,
			managementThreshold,
			actionThreshold,
			bytes32(0)
		);
	}

	function cleanup()
	internal
	{
		super.cleanup();
		_resetRecovery();
	}

	function recovery(bytes memory recoveryKey, address newImplementation, bytes memory initializationData)
	public onlyRecovery(recoveryKey)
	{
		this.updateImplementation(newImplementation, initializationData, true);
	}
}
