pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../MasterBase.sol";


struct EIP712Domain
{
	string  name;
	string  version;
	uint256 chainId;
	address verifyingContract;
}

abstract contract ERC712 is MasterBase
{
	bytes32 internal constant EIP712DOMAIN_TYPEHASH = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;
	string  internal          ERC712_NAME;
	string  internal          ERC712_VERSION;

	function initialize(string memory _name, string memory _version)
	internal virtual
	{
		ERC712_NAME    = _name;
		ERC712_VERSION = _version;
	}

	function cleanup()
	internal virtual override
	{
		delete ERC712_NAME;
		delete ERC712_VERSION;
	}

	function ERC712_domain()
	public view returns(EIP712Domain memory)
	{
		return EIP712Domain({
			name:              ERC712_NAME
		, version:           ERC712_VERSION
		, chainId:           chainID()
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

	function _toEthSignedMessageHash(bytes32 msg_hash)
	internal pure returns (bytes32)
	{
		return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msg_hash));
	}

	function _toEthTypedStructHash(bytes32 _structHash, bytes32 _domainHash)
	internal pure returns (bytes32 typedStructHash)
	{
		return keccak256(abi.encodePacked("\x19\x01", _domainHash, _structHash));
	}
}
