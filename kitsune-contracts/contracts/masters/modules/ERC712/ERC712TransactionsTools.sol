pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


contract ERC712TransactionsTools
{
	bytes32 public constant  TX_TYPEHASH = 0xe9952cc5c9759ae091ba932ae88c7c6459f92bf3591c49b66e66bbe6eacce6b5;
	bytes32 public constant TXS_TYPEHASH = 0x486550a104b6c06f67d2b5e490511d71244d92b5d27b53370ba6e41629be3fb2;

	struct TX
	{
		uint256 op;
		address to;
		uint256 value;
		bytes   data;
		uint256 nonce;
	}

	struct TXS
	{
		TX[] transactions;
	}

	function hash(bytes32[] memory _array)
	internal pure returns (bytes32 arrayhash)
	{
		return keccak256(abi.encodePacked(_array));
	}

	function hash(TX memory _tx)
	internal pure returns (bytes32 txhash)
	{
		return keccak256(abi.encode(
			TX_TYPEHASH
		, _tx.op
		, _tx.to
		, _tx.value
		, keccak256(_tx.data)
		, _tx.nonce
		));
	}

	function hash(TXS memory _txs)
	internal pure returns (bytes32 txshash)
	{
		bytes32[] memory txs_hashes = new bytes32[](_txs.transactions.length);

		for (uint256 i = 0; i < _txs.transactions.length; ++i)
		{
			txs_hashes[i] = hash(_txs.transactions[i]);
		}

		return keccak256(abi.encode(
			TXS_TYPEHASH
		, hash(txs_hashes)
		));
	}
}
