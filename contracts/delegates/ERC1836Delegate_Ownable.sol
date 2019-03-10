pragma solidity ^0.5.5;

import "../../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../node_modules/openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "../../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../ENS/ENSRegistered.sol";
import "../interfaces/IERC1271.sol";

import "./ERC1836DelegateCall.sol";

contract ERC1836Delegate_Ownable is ERC1836DelegateCall, ENSRegistered, IERC1271, Ownable
{
	using SafeMath for uint256;
	using ECDSA    for bytes32;

	// This is a delegate contract, lock it
	constructor()
	public
	{
		renounceOwnership();
	}

	function initialize(address _owner)
	external initialization
	{
		_transferOwnership(_owner);
	}

	function updateDelegate(address _newDelegate, bytes calldata _callback)
	external protected
	{
		// set owner to 0
		_transferOwnership(address(this));
		renounceOwnership();
		// set next delegate
		setDelegate(_newDelegate, _callback);
	}

	function execute(uint256 _operationType, address _to, uint256 _value, bytes calldata _data)
	external onlyOwner
	{
		_execute(_operationType, _to, _value, _data);
	}

	function isValidSignature(bytes32 _data, bytes memory _signature)
	public view returns (bool)
	{
		return owner() == _data.recover(_signature);
	}
}