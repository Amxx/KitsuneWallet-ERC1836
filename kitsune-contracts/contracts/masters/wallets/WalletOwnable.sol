pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../MasterBase.sol";
import "../components/ENSIntegration.sol";
import "../components/ERC725.sol";
import "../components/ERC721Receiver.sol";
import "../components/ERC1271.sol";


contract WalletOwnable is MasterBase, ENSIntegration, ERC725, ERC721Receiver, ERC1271, Ownable
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
	function _isController(address _controller)
	internal view returns (bool)
	{
		return _controller == owner();
	}

	function _isValidSignature(bytes32 data, bytes memory signature)
	internal view returns (bool)
	{
		return owner() == data.recover(signature);
	}
}
