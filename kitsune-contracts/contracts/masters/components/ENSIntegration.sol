pragma solidity ^0.6.0;

import "@ensdomains/ens/contracts/ENS.sol";
// @ensdomains/ens/contracts/ReverseRegistrar.sol is not 0.6.0 ready
// @ensdomains/ens/contracts/FIFSRegistrar.sol is not 0.6.0 ready
// @ensdomains/resolver/contracts/PublicResolver.sol is not 0.6.0 ready
import "../MasterBase.sol";

interface ReverseRegistrar
{
	function setName(string calldata) external returns (bytes32);
}

interface FIFSRegistrar
{
	function register(bytes32, address) external;
}

interface PublicResolver
{
	function setAddr(bytes32, address) external;
}

abstract contract ENSIntegration is MasterBase
{
	bytes32 internal constant ADDR_REVERSE_NODE = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;

	function ENSFIFSRegister(
		ENS            ens,
		PublicResolver resolver,
		bytes32        domainHash,
		bytes32        labelHash)
	public restricted()
	{
		bytes32 node = keccak256(abi.encode(domainHash, labelHash));

		FIFSRegistrar(ens.owner(domainHash)).register(labelHash, address(this));
		ens.setResolver(node, address(resolver));
		resolver.setAddr(node, address(this));
	}

	function ENSReverseRegister(
		ENS           ens,
		string memory name)
	public restricted()
	{
		ReverseRegistrar(ens.owner(ADDR_REVERSE_NODE)).setName(name);
	}

	function ENSFullRegistration(
		ENS            ens,
		PublicResolver resolver,
		bytes32        domainHash,
		bytes32        labelHash,
		string memory  name)
	public restricted()
	{
		ENSFIFSRegister(ens, resolver, domainHash, labelHash);
		ENSReverseRegister(ens, name);
	}
}
