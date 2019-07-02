pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../MasterBase.sol";
import "../modules/ERC725.sol";
import "../modules/ENSRegistered.sol";
import "../modules/ERC721Receiver.sol";
import "../../interfaces/IERC1271.sol";


contract WalletOwnable is MasterBase, ERC725, ERC721Receiver, IERC1271, ENSRegistered, Ownable
{
	using ECDSA for bytes32;

	// This is a Master contract, lock it
	constructor()
	public
	{
		renounceOwnership();
	}

	function initialize(address owner)
	external initializer()
	{
		_transferOwnership(owner);
	}

	function cleanup()
	internal
	{
		renounceOwnership();
	}

	// ACCESSORS
	function _controller()
	internal view returns (address)
	{
		return owner();
	}

	function isValidSignature(bytes32 data, bytes memory signature)
	public view returns (bool)
	{
		return owner() == data.recover(signature);
	}
}
