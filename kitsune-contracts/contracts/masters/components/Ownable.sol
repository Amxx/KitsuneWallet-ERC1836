pragma solidity ^0.6.0;

import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "../MasterBase.sol";
import "./ERC725.sol";
import "../../interfaces/IERC1271.sol";


abstract contract Ownable is MasterBase, IERC1271, ERC725
{
	using ECDSA for bytes32;
	address internal _owner;

	event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

	function initialize(address owner)
	external virtual initializer()
	{
		_transferOwnership(owner);
	}

	function cleanup()
	internal virtual override
	{
		emit OwnershipTransferred(_owner, address(0));
		delete _owner;
	}

	function _transferOwnership(address newOwner)
	internal virtual
	{
		require(newOwner != address(0), "Ownable: new owner is the zero address");
		emit OwnershipTransferred(_owner, newOwner);
		_owner = newOwner;
	}

	function transferOwnership(address newOwner)
	public virtual onlyOwner
	{
		_transferOwnership(newOwner);
	}

	// ACCESSORS
	function owner()
	public override view returns (address)
	{
		return _owner;
	}

	function _isController(address _controller)
	internal override view returns (bool)
	{
		return _controller == owner();
	}

	function isValidSignature(bytes32 data, bytes memory signature)
	public override view returns (bytes4)
	{
		return owner() == data.recover(signature) ? MAGICVALUE : bytes4(0);
	}
}
