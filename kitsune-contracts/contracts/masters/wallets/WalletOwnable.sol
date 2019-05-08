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

	function initialize(address _owner)
	external onlyInitializing
	{
		_transferOwnership(_owner);
	}

	function updateMaster(address _newMaster, bytes calldata _initData, bool _reset)
	external protected
	{
		if (_reset)
		{
			// set owner to 0
			_transferOwnership(address(this));
			renounceOwnership();
		}
		setMaster(_newMaster, _initData);
	}

	function isValidSignature(bytes32 _data, bytes memory _signature)
	public view returns (bool)
	{
		return owner() == _data.recover(_signature);
	}
}
