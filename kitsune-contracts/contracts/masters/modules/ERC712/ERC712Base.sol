pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./ERC712DomainTools.sol";


contract ERC712Base is ERC712DomainTools
{
	string public ERC712_name;
	string public ERC712_version;

	constructor()
	public
	{}

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

	function chainID()
	public pure returns(uint256)
	{
		// uint256 id;
		// assembly { id := chainid() }
		// return id;
		return 1;
	}

	function domain()
	public view returns(EIP712Domain memory)
	{
		return EIP712Domain({
			name:              "TOTO1" //ERC712_name
		, version:           "TOTO2" //ERC712_version
		, chainId:           chainID()
		, verifyingContract: address(this)
		});
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
