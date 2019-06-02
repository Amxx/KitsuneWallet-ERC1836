pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "../MasterBase.sol";
import "../modules/Multisig.sol";
import "../modules/ENSRegistered.sol";
import "../modules/ERC721Receiver.sol";


contract WalletMultisig is MasterBase, Multisig, ENSRegistered, ERC721Receiver
{
	// This is a delegate contract, lock it
	constructor()
	public
	{
	}

	function execute(
		uint256        operationType,
		address        to,
		uint256        value,
		bytes   memory data,
		uint256        nonce,
		bytes[] memory sigs)
	public
	{
		require(++_nonce == nonce, "invalid-nonce");

		bytes32 neededPurpose;
		if (to == address(this))
		{
			require(sigs.length >= _managementThreshold, "missing-signers");
			neededPurpose = PURPOSE_MANAGEMENT;
		}
		else
		{
			require(sigs.length >= _actionThreshold, "missing-signers");
			neededPurpose = PURPOSE_ACTION;
		}

		bytes32 executionID = keccak256(
			abi.encodePacked(
				address(this),
				operationType,
				to,
				value,
				keccak256(data),
				nonce
			)
		)
		.toEthSignedMessageHash();

		address lastSigner = address(0);
		for (uint256 i = 0; i < sigs.length; ++i)
		{
			address signer = executionID.recover(sigs[i]);
			require(signer > lastSigner, "invalid-signatures-ordering");
			require(keyHasPurpose(addrToKey(signer), neededPurpose), "invalid-signature");
			lastSigner = signer;
		}

		_execute(
			operationType,
			to,
			value,
			data
		);
	}

}
