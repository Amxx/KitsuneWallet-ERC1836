pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


library ERC712SignatureVerification
{
	bytes32 public constant EIP712DOMAIN_TYPEHASH = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;
	bytes32 public constant           TX_TYPEHASH = 0x57dd224081b1aaf3ef16337379b9556ad165c23e978e774994e57c91468420c0;
	bytes32 public constant          TXS_TYPEHASH = 0x26a77878a10ff2e48ef6084aafeb592901fa7e491470a5b4a0e645b67ca93ad8;

	struct EIP712Domain
	{
		string  name;
		string  version;
		uint256 chainId;
		address verifyingContract;
	}

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
	public pure returns (bytes32 arrayhash)
	{
		return keccak256(abi.encodePacked(_array));
	}

	function hash(EIP712Domain memory _domain)
	public pure returns (bytes32 domainhash)
	{
		return keccak256(abi.encode(
			EIP712DOMAIN_TYPEHASH
		, keccak256(bytes(_domain.name))
		, keccak256(bytes(_domain.version))
		, _domain.chainId
		, _domain.verifyingContract
		));
	}

	function hash(TX memory _tx)
	public pure returns (bytes32 txhash)
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
	public pure returns (bytes32 txshash)
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

	function toEthSignedMessageHash(bytes32 msg_hash)
	public pure returns (bytes32)
	{
		return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msg_hash));
	}

	function toEthTypedStructHash(bytes32 _structHash, bytes32 _domainHash)
	public pure returns (bytes32 typedStructHash)
	{
		return keccak256(abi.encodePacked("\x19\x01", _domainHash, _structHash));
	}
}
