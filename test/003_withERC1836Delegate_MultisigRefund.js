const ERC1836Proxy                   = artifacts.require("ERC1836Proxy");
const ERC1836Delegate_MultisigRefund = artifacts.require("ERC1836Delegate_MultisigRefund");
const TargetContract                 = artifacts.require("TargetContract");

const { shouldFail } = require('openzeppelin-test-helpers');
const utils          = require('./utils.js');

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

contract('ERC1836Delegate_MultisigRefund', async (accounts) => {

	assert.isAtLeast(accounts.length, 10, "should have at least 10 accounts");
	relayer = accounts[1];
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
			(await ERC1836Delegate_MultisigRefund.deployed()).address,
			utils.prepareData(ERC1836Delegate_MultisigRefund, "initialize", [
				[ utils.addressToBytes32(user1) ],
				[ "0x0000000000000000000000000000000000000000000000000000000000000003" ],
				1,
				1
			]),
			{ from: relayer }
		);
		Ident = await ERC1836Delegate_MultisigRefund.at(Proxy.address);
	});

	it ("Verify proxy initialization", async () => {
		assert.isTrue (await Ident.keyHasPurpose(utils.addressToBytes32(user1), "0x0000000000000000000000000000000000000000000000000000000000000001"));
		assert.isTrue (await Ident.keyHasPurpose(utils.addressToBytes32(user1), "0x0000000000000000000000000000000000000000000000000000000000000002"));
		assert.isFalse(await Ident.keyHasPurpose(utils.addressToBytes32(user1), "0x0000000000000000000000000000000000000000000000000000000000000004"));
		assert.isFalse(await Ident.keyHasPurpose(utils.addressToBytes32(user2), "0x0000000000000000000000000000000000000000000000000000000000000001"));
		assert.isFalse(await Ident.keyHasPurpose(utils.addressToBytes32(user2), "0x0000000000000000000000000000000000000000000000000000000000000002"));
		assert.isFalse(await Ident.keyHasPurpose(utils.addressToBytes32(user2), "0x0000000000000000000000000000000000000000000000000000000000000004"));
	});

	it("Deposit on proxy", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), 0);
		txMined = await Ident.send(web3.utils.toWei("1.00", "ether"), { from: user1 });
		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("1.00", "ether"));
	});

	it("Execute - Pay with proxy", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("1.00", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("0.00", "ether"));

		await utils.sendMetaTX_MultisigRefund(
			Ident,
			{
				type:  0,
				to:    dest1,
				value: web3.utils.toWei("0.50", "ether"),
				data:  [],
				// nonce: 1
			},
			user1,
			relayer
		);

		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("0.50", "ether"));
	});

	it("Execute - Call with proxy", async () => {
		randomdata = web3.utils.randomHex(32);

		await utils.sendMetaTX_MultisigRefund(
			Ident,
			{
				type:  0,
				to:    Target.address,
				value: 0,
				data:  utils.prepareData(TargetContract, "call", [ randomdata ]),
				// nonce: 2
			},
			user1,
			relayer
		);

		assert.equal(await Target.lastSender(), Ident.address);
		assert.equal(await Target.lastData(),   randomdata);
	});

	it("Unauthorized execute", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));

		await shouldFail.reverting(utils.sendMetaTX_MultisigRefund(
			Ident,
			{
				type:  0,
				to:    user2,
				value: 0,
				data:  utils.prepareData(TargetContract, "call", [ randomdata ]),
				// nonce: 3
			},
			user2,
			relayer
		));

		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));
	});

});
