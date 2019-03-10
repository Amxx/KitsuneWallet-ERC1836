pragma solidity ^0.5.5;

import "../../node_modules/@ensdomains/ens/contracts/ENSRegistry.sol";
import "../../node_modules/@ensdomains/ens/contracts/FIFSRegistrar.sol";
import "../../node_modules/@ensdomains/ens/contracts/ReverseRegistrar.sol";
import "./PublicResolver.sol";

import "../ERC1836.sol";

contract ENSRegistered is ERC1836
{
	bytes32 constant ADDR_REVERSE_NODE = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;

	function setENS(
		bytes32         _hashLabel,
		string calldata _name,
		bytes32         _node,
		ENSRegistry     _ens,
		FIFSRegistrar   _registrar,
		PublicResolver  _resolver)
	external protected
	{
		// ENSRegistered
		_registrar.register(_hashLabel, address(this));
		_ens.setResolver(_node, address(_resolver));
		_resolver.setAddr(_node, address(this));
		ReverseRegistrar(_ens.owner(ADDR_REVERSE_NODE)).setName(_name);
	}
}
