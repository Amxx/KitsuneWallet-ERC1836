pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "../MasterBase.sol";
import "../modules/Multisig.sol";
import "../modules/ENSRegistered.sol";
import "../modules/ERC712Base.sol";
import "../modules/ERC721Receiver.sol";


contract WalletMultisigV2 is MasterBase, Multisig, ENSRegistered, ERC712Base, ERC721Receiver
{
	using ERC712SignatureVerification for bytes32;
	using ERC712SignatureVerification for ERC712SignatureVerification.EIP712Domain;
	using ERC712SignatureVerification for ERC712SignatureVerification.TX;
	using ERC712SignatureVerification for ERC712SignatureVerification.TXS;

	// This is a delegate contract, lock it
	constructor()
	public
	{
	}

	function execute(
		ERC712SignatureVerification.TX memory _tx,
		bytes[]                        memory _sigs)
	public
	{
		bytes32 executionID = _tx.hash().toEthTypedStructHash(domain().hash());

		_checkSignatures(
			executionID,
			_tx.to == address(this),
			_sigs
		);

		_execute(_tx);
	}

	function execute(
		ERC712SignatureVerification.TXS memory _txs,
		bytes[]                         memory _sigs)
	public
	{
		bytes32 executionID = _txs.hash().toEthTypedStructHash(domain().hash());

		bool needsManagement = false;
		for (uint256 i = 0; i < _txs.transactions.length; ++i)
		{
			if (_txs.transactions[i].to == address(this))
			{
				needsManagement = true;
				break;
			}
		}

		_checkSignatures(
			executionID,
			needsManagement,
			_sigs
		);

		for (uint256 i = 0; i < _txs.transactions.length; ++i)
		{
			_execute(_txs.transactions[i]);
		}
	}

	function _checkSignatures(
		bytes32        _hash,
		bool           _management,
		bytes[] memory _sigs)
	internal view returns (bool)
	{
		require(_sigs.length >= ( _management ? _managementThreshold : _actionThreshold ), "missing-signers");
		bytes32 neededPurpose = ( _management ?   PURPOSE_MANAGEMENT :   PURPOSE_ACTION );

		address lastSigner = address(0);
		for (uint256 i = 0; i < _sigs.length; ++i)
		{
			address signer = _hash.recover(_sigs[i]);
			require(signer > lastSigner, "invalid-signatures-ordering");
			require(keyHasPurpose(addrToKey(signer), neededPurpose), "invalid-signature");
			lastSigner = signer;
		}
		return true;
	}

	function _execute(ERC712SignatureVerification.TX memory _tx)
	internal
	{
		require(_incrNonce() == _tx.nonce, "invalid-nonce");

		_execute(
			_tx.op,
			_tx.to,
			_tx.value,
			_tx.data
		);
	}

}
