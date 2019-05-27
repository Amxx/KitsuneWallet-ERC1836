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

	function updateMaster(address newMaster, bytes memory initData, bool reset)
	public onlyOwner()
	{
		if (reset)
		{
			_resetRecovery();
		}
		super.updateMaster(
			newMaster,
			initData,
			reset
		);
	}

	function recovery(bytes memory recoveryKey, address newMaster, bytes memory initData)
	public onlyRecovery(recoveryKey)
	{
		this.updateMaster(newMaster, initData, true);
	}
}
