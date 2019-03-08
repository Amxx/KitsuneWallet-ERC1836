const ERC1xxx        = artifacts.require("ERC1xxx");
const ERC725Delegate = artifacts.require("ERC725Delegate");
const GenericTarget  = artifacts.require("GenericTarget");

const { shouldFail } = require('openzeppelin-test-helpers');
const utils          = require('./utils.js');

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

contract('ERC1xxx', async (accounts) => {

	// assert.isAtLeast(accounts.length, 10, "should have at least 10 accounts");

	var Proxy = null;
	var Ident = null;
	var dest1 = web3.utils.randomHex(20);

	/***************************************************************************
	 *                        Environment configuration                        *
	 ***************************************************************************/
	before("configure", async () => {
		console.log("# web3 version:", web3.version);
		Target = await GenericTarget.deployed();
	});

	it ("Create proxy", async () => {
		Proxy = await ERC1xxx.new(
			(await ERC725Delegate.deployed()).address,
			utils.prepareData(ERC725Delegate, "initialize", [ accounts[0] ]),
			{ from: accounts[1] }
		);
		Ident = await ERC725Delegate.at(Proxy.address);
	});

	it ("Verify proxy initialization", async () => {
		assert.equal(await Ident.owner(), accounts[0]);
	});

	it("Deposit on proxy", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), 0);

		txMined = await Ident.send(web3.utils.toWei("1.00", "ether"), { from: accounts[0] });

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
			{ from: accounts[0] }
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
			utils.prepareData(GenericTarget, "call", [ randomdata ]),
			{ from: accounts[0] }
		);

		assert.equal(await Target.lastSender(), Ident.address);
		assert.equal(await Target.lastData(),   randomdata);
	});

	it("Unauthorized execute", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));

		await shouldFail.reverting(Ident.execute(
			0,
			accounts[1],
			web3.utils.toWei("0.50", "ether"),
			"0x",
			{ from: accounts[1] }
		));

		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));
	});

	it("Unauthorized transferOwnership", async () => {
		await shouldFail.reverting(Ident.transferOwnership(
			accounts[1],
			{ from: accounts[1] }
		));
	});

	it("Authorized transferOwnership", async () => {
		await Ident.transferOwnership(
			accounts[1],
			{ from: accounts[0] }
		);
	});

	it("Authorized execute", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));

		await Ident.execute(
			0,
			accounts[1],
			web3.utils.toWei("0.50", "ether"),
			"0x",
			{ from: accounts[1] }
		);

		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.00", "ether"));
	});

	it("updateDelegate", async () => {
		await Ident.execute(
			0,
			Ident.address,
			0,
			utils.prepareData(ERC725Delegate, "updateDelegate", [
				(await ERC725Delegate.deployed()).address,
				utils.prepareData(ERC725Delegate, "initialize", [ accounts[0] ])
			]),
			{ from: accounts[1] }
		)
		assert.equal(await Ident.owner(), accounts[0]);
	});

	it ("initialization - protected", async () => {
		await shouldFail.reverting(Ident.initialize(
			accounts[1],
			{ from: accounts[0] }
		));
	});
	it ("updateDelegate - protected", async () => {
		await shouldFail.reverting(Ident.updateDelegate(
			(await ERC725Delegate.deployed()).address,
			utils.prepareData(ERC725Delegate, "initialize", [ accounts[1] ]),
			{ from: accounts[0] }
		));
	});

});
