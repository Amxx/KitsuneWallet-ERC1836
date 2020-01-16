pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


contract ERC712Base
{
	bytes32 public constant EIP712DOMAIN_TYPEHASH = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;
	string  public ERC712_name;
	string  public ERC712_version;

	struct EIP712Domain
	{
		string  name;
		string  version;
		uint256 chainId;
		address verifyingContract;
	}

	constructor()
	public
	{}

	function domain()
	public view returns(EIP712Domain memory)
	{
		return EIP712Domain({
			name:              ERC712_name
		, version:           ERC712_version
		, chainId:           _chainID()
		, verifyingContract: address(this)
		});
	}

	function _hash(EIP712Domain memory _domain)
	internal pure returns (bytes32 domainhash)
	{
		return keccak256(abi.encode(
			EIP712DOMAIN_TYPEHASH
		, keccak256(bytes(_domain.name))
		, keccak256(bytes(_domain.version))
		, _domain.chainId
		, _domain.verifyingContract
		));
	}

	function _chainID()
	internal pure returns(uint256 id)
	{
		// assembly { id := chainid() }
		id = 1;
	}

	function _initializeERC712Base(string memory _name, string memory _version)
	internal
	{
		ERC712_name    = _name;
		ERC712_version = _version;
	}

	function _cleanupERC712Base()
	internal
	{
		delete ERC712_name;
		delete ERC712_version;
	}


	function toEthSignedMessageHash(bytes32 msg_hash)
	internal pure returns (bytes32)
	{
		return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msg_hash));
	}

	function toEthTypedStructHash(bytes32 _structHash, bytes32 _domainHash)
	internal pure returns (bytes32 typedStructHash)
	{
		return keccak256(abi.encodePacked("\x19\x01", _domainHash, _structHash));
	}
}
