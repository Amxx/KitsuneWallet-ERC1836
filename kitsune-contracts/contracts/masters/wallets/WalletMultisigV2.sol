pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../components/MasterCore.sol";
import "../components/Multisig.sol";
import "../components/ENSIntegration.sol";
import "../components/ERC712.sol";
import "../components/ERC712TransactionsTools.sol";
import "../components/ERC721Receiver.sol";


contract WalletMultisigV2 is MasterCore, Multisig, ENSIntegration, ERC712, ERC712TransactionsTools, ERC721Receiver
{
	constructor()
	public
	{
	}

	function initialize(address masterKey)
	public virtual override initializer()
	{
		Multisig.initialize(
			masterKey
		);
		ERC712.initialize(
			"KitsuneWalletMultisigV2",
			"0.0.1-beta.1"
		);
	}

	function initialize(
		bytes32[] memory keys,
		bytes32[] memory purposes,
		uint256          managementThreshold,
		uint256          actionThreshold)
	public virtual override initializer()
	{
		Multisig.initialize(
			keys,
			purposes,
			managementThreshold,
			actionThreshold
		);
		ERC712.initialize(
			"KitsuneWalletMultisigV2",
			"0.0.1-beta.1"
		);
	}

	function cleanup()
	internal virtual override(IMaster, Multisig, ERC712)
	{
		Multisig.cleanup();
		ERC712.cleanup();
	}

	function execute(
		TX      memory _tx,
		bytes[] memory _sigs)
	public
	{
		bytes32 executionID = toEthTypedStructHash(hash(_tx), hash(domain()));

		_checkSignatures(
			executionID,
			_tx.to == address(this),
			_sigs
		);

		_execute(_tx);
	}

	function batch(
		TXS     memory _txs,
		bytes[] memory _sigs)
	public
	{
		bytes32 executionID = toEthTypedStructHash(hash(_txs), hash(domain()));

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

	function _execute(TX memory _tx)
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
