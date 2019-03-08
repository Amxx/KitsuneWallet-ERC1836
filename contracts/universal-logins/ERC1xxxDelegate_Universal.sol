pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "../../node_modules/universal-login-contracts/contracts/ENS/ENS.sol";
import "../../node_modules/universal-login-contracts/contracts/ENS/FIFSRegistrar.sol";
import "../../node_modules/universal-login-contracts/contracts/ENS/PublicResolver.sol";
import "../../node_modules/universal-login-contracts/contracts/ENS/ReverseRegistrar.sol";
import "../../node_modules/universal-login-contracts/contracts/ERC1077.sol";

import "../ERC1xxxDelegate.sol";

contract ERC1xxxDelegate_Universal is ERC1xxxDelegate, ERC1077
{
	bytes32 constant ADDR_REVERSE_NODE = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;

	// This is a delegate contract, lock it
	constructor()
	public
	ERC1xxx(address(0), bytes(""))
	{
	}

	function initialize(
		bytes32         _key,
		bytes32         _hashLabel,
		string calldata _name,
		bytes32         _node,
		ENS             _ens,
		FIFSRegistrar   _registrar,
		PublicResolver  _resolver)
	external initialization
	{
		// ENSRegistered
		_registrar.register(_hashLabel, address(this));
		_ens.setResolver(_node, address(_resolver));
		_resolver.setAddr(_node, address(this));
		ReverseRegistrar(_ens.owner(ADDR_REVERSE_NODE)).setName(_name);

		// ERC1077 → KeyHolder
		keys[_key].key = _key;
		keys[_key].purpose = MANAGEMENT_KEY;
		keys[_key].keyType = ECDSA_TYPE;
		keysByPurpose[MANAGEMENT_KEY].push(_key);
		emit KeyAdded(keys[_key].key,  keys[_key].purpose, keys[_key].keyType);
	}

	function updateDelegate(address _newDelegate, bytes calldata _callback)
	external protected
	{
		// reset memory space

		// set next delegate
		setDelegate(_newDelegate, _callback);
	}
}
