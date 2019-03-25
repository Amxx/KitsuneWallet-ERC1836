pragma solidity ^0.5.0;

import "../../../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../../node_modules/openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "../../../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../../ENS/ENSRegistered.sol";
import "../../interfaces/IERC1271.sol";
import "../MasterBase.sol";
import "../MasterCallBase.sol";


contract WalletOwnable is MasterBase, MasterCallBase, ENSRegistered, IERC1271, Ownable
{
	using SafeMath for uint256;
	using ECDSA    for bytes32;

	// This is a Master contract, lock it
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
