pragma solidity ^0.5.5;

import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./ERC1xxxDelegate.sol";

contract ERC725Delegate is ERC1xxxDelegate, Ownable
{
	// This is a delegate contract, lock it
	constructor()
	public
	ERC1xxx(address(0), bytes(""))
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
}
