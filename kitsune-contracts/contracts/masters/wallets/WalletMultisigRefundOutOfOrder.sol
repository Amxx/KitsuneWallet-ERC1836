pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "../MasterBase.sol";
import "../MasterKeysBase.sol";
import "../ERC721Receiver.sol";


contract WalletMultisigRefundOutOfOrder is MasterBase, MasterKeysBase, ERC721Receiver
{
	using SafeMath for uint256;

	// for refund fine tunning
	uint256 constant BASEGASE = 43600;

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
		bytes32        salt,
		address        gasToken,
		uint256        gasPrice,
		bytes[] memory sigs)
	public
	{
		uint256 gasBefore = gasleft();

		++_nonce;
		require(nonce == 0 || nonce == _nonce, "invalid-nonce");

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
				salt,
				gasToken,
				gasPrice
			)
		)
		.toEthSignedMessageHash();

		require(_persistent[executionID] == bytes32(0), "transaction-replay");
		_persistent[executionID] = bytes32(0xa50daf8ffad995556f094fb7bb26ec5c7aadc7f574c741d0237ea13300bc1dd7);

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

	function refund(uint256 _gasValue, address _gasToken)
	internal
	{
		if (_gasToken == address(0))
		{
			msg.sender.transfer(_gasValue);
		}
		else
		{
			IERC20(_gasToken).transfer(msg.sender, _gasValue);
		}
	}

}
