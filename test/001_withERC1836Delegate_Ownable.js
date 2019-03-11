const ERC1836Proxy            = artifacts.require("ERC1836Proxy");
const ERC1836Delegate_Ownable = artifacts.require("ERC1836Delegate_Ownable");
const TargetContract          = artifacts.require("TargetContract");

const { shouldFail } = require('openzeppelin-test-helpers');
const utils          = require('./utils.js');

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

contract('ERC1836Delegate_Ownable', async (accounts) => {

	assert.isAtLeast(accounts.length, 10, "should have at least 10 accounts");
	relayer = accounts[0];
	user1   = accounts[1];
	user2   = accounts[2];

	var Proxy = null;
	var Ident = null;
	var dest1 = web3.utils.randomHex(20);

	/***************************************************************************
	 *                        Environment configuration                        *
	 ***************************************************************************/
	before("configure", async () => {
		console.log("# web3 version:", web3.version);
		Target = await TargetContract.deployed();
	});

	it ("Create proxy", async () => {
		Proxy = await ERC1836Proxy.new(
			(await ERC1836Delegate_Ownable.deployed()).address,
			utils.prepareData(ERC1836Delegate_Ownable, "initialize", [
				user1
			]),
			{ from: relayer }
		);
		Ident = await ERC1836Delegate_Ownable.at(Proxy.address);
	});

	it ("Verify proxy initialization", async () => {
		assert.equal(await Ident.owner(), user1);
	});

	it("Deposit on proxy", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), 0);

		txMined = await Ident.send(web3.utils.toWei("1.00", "ether"), { from: user1 });

		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("1.00", "ether"));
	});

	it("Execute - Pay with proxy", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("1.00", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("0.00", "ether"));

		txMined = await Ident.execute(
			0,
			dest1,
			web3.utils.toWei("0.50", "ether"),
			"0x",
			{ from: user1 }
		);

		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("0.50", "ether"));
	});

	it("Execute - Call with proxy", async () => {
		randomdata = web3.utils.randomHex(32);

		txMined = await Ident.execute(
			0,
			Target.address,
			0,
			utils.prepareData(TargetContract, "call", [ randomdata ]),
			{ from: user1 }
		);

		assert.equal(await Target.lastSender(), Ident.address);
		assert.equal(await Target.lastData(),   randomdata);
	});

	it("Unauthorized execute", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));

		await shouldFail.reverting(Ident.execute(
			0,
			user2,
			web3.utils.toWei("0.50", "ether"),
			"0x",
			{ from: user2 }
		));

		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));
	});

	it("Unauthorized transferOwnership", async () => {
		await shouldFail.reverting(Ident.transferOwnership(
			user2,
			{ from: user2 }
		));
	});

	it("Authorized transferOwnership", async () => {
		await Ident.transferOwnership(
			user2,
			{ from: user1 }
		);
	});

	it("Authorized execute", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));

		await Ident.execute(
			0,
			user2,
			web3.utils.toWei("0.50", "ether"),
			"0x",
			{ from: user2 }
		);

		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.00", "ether"));
	});

	it("updateDelegate", async () => {
		await Ident.execute(
			0,
			Ident.address,
			0,
			utils.prepareData(ERC1836Delegate_Ownable, "updateDelegate", [
				(await ERC1836Delegate_Ownable.deployed()).address,
				utils.prepareData(ERC1836Delegate_Ownable, "initialize", [
					user1
				])
			]),
			{ from: user2 }
		)
		assert.equal(await Ident.owner(), user1);
	});

	it ("initialization - protected", async () => {
		await shouldFail.reverting(Ident.initialize(
			user2,
			{ from: user1 }
		));
	});

	it ("updateDelegate - protected", async () => {
		await shouldFail.reverting(Ident.updateDelegate(
			(await ERC1836Delegate_Ownable.deployed()).address,
			utils.prepareData(ERC1836Delegate_Ownable, "initialize", [
				user2
			]),
			{ from: user1 }
		));
	});

});
