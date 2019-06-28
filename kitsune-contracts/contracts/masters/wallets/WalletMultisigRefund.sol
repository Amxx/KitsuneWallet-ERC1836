pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "../MasterBase.sol";
import "../modules/Multisig.sol";
import "../modules/ENSRegistered.sol";
import "../modules/ERC721Receiver.sol";


contract WalletMultisigRefund is MasterBase, Multisig, ENSRegistered, ERC721Receiver
{
	using SafeMath for uint256;

	// for refund fine tunning
	uint256 constant BASEGASE = 41300;

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
		address        gasToken,
		uint256        gasPrice,
		bytes[] memory sigs)
	public
	{
		uint256 gasBefore = gasleft();

		require(_incrNonce() == nonce, "invalid-nonce");

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
				nonce,
				gasToken,
				gasPrice
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

		refund(
			BASEGASE
			.add(gasBefore)
			.sub(gasleft())
			.mul(gasPrice),
			gasToken
		);
	}

	function refund(uint256 gasValue, address gasToken)
	internal
	{
		if (gasToken == address(0))
		{
			msg.sender.transfer(gasValue);
		}
		else
		{
			IERC20(gasToken).transfer(msg.sender, gasValue);
		}
	}

}
