pragma solidity ^0.5.0;

import "@ensdomains/ens/contracts/ENSRegistry.sol";
import "@ensdomains/ens/contracts/FIFSRegistrar.sol";
import "@ensdomains/ens/contracts/ReverseRegistrar.sol";
import "@ensdomains/resolver/contracts/PublicResolver.sol";

import "../../tools/Controlled.sol";

contract ENSRegistered is Controlled
{
	bytes32 internal constant ADDR_REVERSE_NODE = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;

	function registerENS(
		bytes32         hashLabel,
		string calldata name,
		bytes32         node,
		ENSRegistry     ens,
		FIFSRegistrar   registrar,
		PublicResolver  resolver)
	external onlyController()
	{
		// ENSRegistered
		registrar.register(hashLabel, address(this));
		ens.setResolver(node, address(resolver));
		resolver.setAddr(node, address(this));
		ReverseRegistrar(ens.owner(ADDR_REVERSE_NODE)).setName(name);
	}
}
