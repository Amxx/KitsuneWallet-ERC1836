const ENSRegistry      = artifacts.require("universal-login-contracts/ENSRegistry")
const PublicResolver   = artifacts.require("universal-login-contracts/PublicResolver")
const ReverseRegistrar = artifacts.require("universal-login-contracts/ReverseRegistrar")
const FIFSRegistrar    = artifacts.require("universal-login-contracts/FIFSRegistrar")

const utils = require('ethers').utils;

module.exports = async function(deployer, network, accounts)
{
	var ens            = null;
	var resolver       = null;
	var adminRegistrar = null;
	var registrars     = [];

	async function bootstrap()
	{
		const emptyNode = utils.formatBytes32String(0);
		// Registry
		await deployer.deploy(ENSRegistry);
		ens = await ENSRegistry.deployed();
		// Public resolver
		await deployer.deploy(PublicResolver, ens.address);
		resolver = await PublicResolver.deployed();
		// Admin Registrar
		adminRegistrar = await FIFSRegistrar.new(ens.address, emptyNode);
		// Set resigry owner
		await ens.setOwner(utils.formatBytes32String(0), adminRegistrar.address);
	}

	async function registerTLD(tld)
	{
		const label = utils.keccak256(utils.toUtf8Bytes(tld));
		const ethNode = utils.namehash(tld);
		await adminRegistrar.register(label, accounts[0]);
		await ens.setResolver(ethNode, resolver.address);
		registrars[tld] = await FIFSRegistrar.new(ens.address, ethNode);
		await ens.setOwner(ethNode, registrars[tld].address);
	}

	async function registerDomain(label, domain)
	{
		const labelHash = utils.keccak256(utils.toUtf8Bytes(label));
		const newDomain = `${label}.${domain}`;
		const node = utils.namehash(newDomain);
		await registrars[domain].register(labelHash, accounts[0]);
		await ens.setResolver(node, resolver.address);
		registrars[newDomain] = await FIFSRegistrar.new(ens.address, node);
		await ens.setOwner(node, registrars[newDomain].address);
		return registrars[newDomain];
	}

	async function registerReverseRegistrar()
	{
		await registerTLD('reverse');
		const label = 'addr';
		const labelHash = utils.keccak256(utils.toUtf8Bytes(label));
		registrars['addr.reverse'] = await deployer.deploy(ReverseRegistrar, ens.address, resolver.address);
		await registrars.reverse.register(labelHash, registrars['addr.reverse'].address);
	}

	await bootstrap();
	await registerTLD("eth");
	await registerReverseRegistrar();
	await registerDomain("mylogin", "eth");

	console.log("ENSRegistry deployed at address: " + (await ENSRegistry.deployed()).address);
	console.log("PublicResolver deployed at address: " + (await PublicResolver.deployed()).address);
};
