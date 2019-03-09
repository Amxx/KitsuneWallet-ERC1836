const ENSRegistry               = artifacts.require("universal-login-contracts/ENSRegistry")
const FIFSRegistrar             = artifacts.require("universal-login-contracts/FIFSRegistrar")
const ReverseRegistrar          = artifacts.require("universal-login-contracts/ReverseRegistrar")
const PublicResolver            = artifacts.require("universal-login-contracts/PublicResolver")

const ERC1836Proxy              = artifacts.require("ERC1836Proxy");
const ERC1836Delegate_Universal = artifacts.require("ERC1836Delegate_Universal");
const GenericTarget             = artifacts.require("GenericTarget");

const { shouldFail } = require('openzeppelin-test-helpers');
const ethers         = require('ethers');
const utils          = require('./utils.js');

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

contract('ERC1836Delegate_Universal', async (accounts) => {

	assert.isAtLeast(accounts.length, 10, "should have at least 10 accounts");
	relayer = accounts[1];
	user1   = accounts[1];
	user2   = accounts[2];

	var ENS      = null;
	var Resolver = null;
	var Reverse  = null;

	var Proxy    = null;
	var Ident    = null;
	var dest1    = web3.utils.randomHex(20);

	/***************************************************************************
	 *                        Environment configuration                        *
	 ***************************************************************************/
	before("configure", async () => {
		console.log("# web3 version:", web3.version);
		ENS      = await ENSRegistry.deployed();
		Resolver = await PublicResolver.deployed();
		Reverse  = await ReverseRegistrar.deployed();
		Target   = await GenericTarget.deployed();
	});

	it ("Create proxy", async () => {
		const label     = "hadrien";
		const domain    = "mylogin.eth";

		const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label));
		const newDomain = `${label}.${domain}`;
		const nodeHash  = ethers.utils.namehash(newDomain);
		const registrar = await ENS.owner(ethers.utils.namehash(domain));

		Proxy = await ERC1836Proxy.new(
			(await ERC1836Delegate_Universal.deployed()).address,
			utils.prepareData(ERC1836Delegate_Universal, "initialize", [
				utils.addressToBytes32Padding(user1),
				labelHash,
				newDomain,
				nodeHash,
				ENS.address,
				registrar,
				Resolver.address
			]),
			{ from: relayer }
		);
		Ident = await ERC1836Delegate_Universal.at(Proxy.address);
	});

	it ("Verify proxy initialization", async () => {
		assert.isTrue (await Ident.keyExist(utils.addressToBytes32Padding(user1)));
		assert.isFalse(await Ident.keyExist(utils.addressToBytes32Padding(user2)));
		assert.isTrue (await Ident.keyHasPurpose(utils.addressToBytes32Padding(user1), "0x0000000000000000000000000000000000000000000000000000000000000001"));
		assert.isFalse(await Ident.keyHasPurpose(utils.addressToBytes32Padding(user1), "0x0000000000000000000000000000000000000000000000000000000000000002"));
		assert.isFalse(await Ident.keyHasPurpose(utils.addressToBytes32Padding(user1), "0x0000000000000000000000000000000000000000000000000000000000000004"));
		assert.isFalse(await Ident.keyHasPurpose(utils.addressToBytes32Padding(user2), "0x0000000000000000000000000000000000000000000000000000000000000001"));
		assert.isFalse(await Ident.keyHasPurpose(utils.addressToBytes32Padding(user2), "0x0000000000000000000000000000000000000000000000000000000000000002"));
		assert.isFalse(await Ident.keyHasPurpose(utils.addressToBytes32Padding(user2), "0x0000000000000000000000000000000000000000000000000000000000000004"));
	});

	it ("Verify forward ens registration", async () => {
		name = "hadrien.mylogin.eth";

		nodeHash = ethers.utils.namehash(name);
		resolver = await PublicResolver.at(await ENS.resolver(nodeHash));
		address  = await resolver.addr(nodeHash);
		assert.equal(address, Ident.address);
	});

	it ("Verify reverse ens registration", async () => {
		address  = Ident.address;

		nodeHash = await Reverse.node(address);
		resolver = await PublicResolver.at(await ENS.resolver(nodeHash));
		name     = await resolver.name(nodeHash);
		assert.equal(name, "hadrien.mylogin.eth");
	});

	it("Deposit on proxy", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), 0);
		txMined = await Ident.send(web3.utils.toWei("1.00", "ether"), { from: user1 });
		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("1.00", "ether"));
	});

	it("Execute - Pay with proxy", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("1.00", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("0.00", "ether"));

		await utils.sendMetaTX_Universal(
			Ident,
			{
				type:  0,
				to:    dest1,
				value: web3.utils.toWei("0.50", "ether"),
				data:  [],
			},
			user1,
			relayer
		);

		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("0.50", "ether"));
	});

	it("Execute - Call with proxy", async () => {
		randomdata = web3.utils.randomHex(32);

		await utils.sendMetaTX_Universal(
			Ident,
			{
				type:  0,
				to:    Target.address,
				value: 0,
				data:  utils.prepareData(GenericTarget, "call", [ randomdata ]),
			},
			user1,
			relayer
		);

		assert.equal(await Target.lastSender(), Ident.address);
		assert.equal(await Target.lastData(),   randomdata);
	});
	it("Unauthorized execute", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));

		await shouldFail.reverting(utils.sendMetaTX_Universal(
			Ident,
			{
				type:  0,
				to:    user2,
				value: 0,
				data:  utils.prepareData(GenericTarget, "call", [ randomdata ]),
			},
			user2,
			relayer
		));

		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));
	});

});
