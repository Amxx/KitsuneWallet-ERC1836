pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../../interfaces/IERC1271.sol";
import "../ERC725Base.sol";
import "../MasterBase.sol";


contract WalletOwnable is ERC725Base, MasterBase, IERC1271, Ownable
{
	using ECDSA for bytes32;

	// This is a Master contract, lock it
	constructor()
	public
	{
		renounceOwnership();
	}

	function initialize(address owner)
	external onlyInitializing()
	{
		_transferOwnership(owner);
	}

	function updateMaster(address newMaster, bytes calldata initData, bool reset)
	external onlyOwner()
	{
		if (reset)
		{
			// set owner to 0
			renounceOwnership();
		}
		setMaster(newMaster, initData);
	}

	function isValidSignature(bytes32 data, bytes memory signature)
	public view returns (bool)
	{
		return owner() == data.recover(signature);
	}
}
