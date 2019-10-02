pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


contract ERC712DomainTools
{
	bytes32 public constant EIP712DOMAIN_TYPEHASH = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;

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

	function hash(EIP712Domain memory _domain)
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
}
