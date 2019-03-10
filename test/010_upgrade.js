const ERC1836Proxy             = artifacts.require("ERC1836Proxy");
const ERC1836Delegate_Basic    = artifacts.require("ERC1836Delegate_Basic");
const ERC1836Delegate_Multisig = artifacts.require("ERC1836Delegate_Multisig");
const TargetContract           = artifacts.require("TargetContract");

const { shouldFail } = require('openzeppelin-test-helpers');
const utils          = require('./utils.js');

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

contract('upgrade', async (accounts) => {

	assert.isAtLeast(accounts.length, 10, "should have at least 10 accounts");
	relayer = accounts[1];
	user1   = accounts[1];
	user2   = accounts[2];

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
		_proxy = await ERC1836Proxy.new(
			(await ERC1836Delegate_Basic.deployed()).address,
			utils.prepareData(ERC1836Delegate_Basic, "initialize", [
				user1
			]),
			{ from: relayer }
		);
		Ident = await ERC1836Delegate_Basic.at(_proxy.address);
	});

	it ("Verify proxy initialization", async () => {
		assert.equal(await Ident.owner(), user1);
	});

	it("Deposit on proxy", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), 0);

		txMined = await Ident.send(web3.utils.toWei("1.00", "ether"), { from: user1 });

		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("1.00", "ether"));
	});

	it("Execute - Pay with proxy - Basic", async () => {
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

	it("updateDelegate", async () => {
		await Ident.execute(
			0,
			Ident.address,
			0,
			utils.prepareData(ERC1836Delegate_Basic, "updateDelegate", [
				(await ERC1836Delegate_Multisig.deployed()).address,
				utils.prepareData(ERC1836Delegate_Multisig, "initialize", [
					[
						utils.addressToBytes32(user1),
						utils.addressToBytes32(user2)
					],
					[
						"0x0000000000000000000000000000000000000000000000000000000000000007",
						"0x0000000000000000000000000000000000000000000000000000000000000006"
					],
					1,
					1
				])
			]),
			{ from: user1 }
		);
		Ident = await ERC1836Delegate_Multisig.at(Ident.address);
	});

	it ("Verify proxy initialization", async () => {
		assert.isTrue (await Ident.keyHasPurpose(utils.addressToBytes32(user1), "0x0000000000000000000000000000000000000000000000000000000000000001"));
		assert.isTrue (await Ident.keyHasPurpose(utils.addressToBytes32(user1), "0x0000000000000000000000000000000000000000000000000000000000000002"));
		assert.isTrue (await Ident.keyHasPurpose(utils.addressToBytes32(user1), "0x0000000000000000000000000000000000000000000000000000000000000004"));
		assert.isFalse(await Ident.keyHasPurpose(utils.addressToBytes32(user2), "0x0000000000000000000000000000000000000000000000000000000000000001"));
		assert.isTrue (await Ident.keyHasPurpose(utils.addressToBytes32(user2), "0x0000000000000000000000000000000000000000000000000000000000000002"));
		assert.isTrue (await Ident.keyHasPurpose(utils.addressToBytes32(user2), "0x0000000000000000000000000000000000000000000000000000000000000004"));
	});

	it("Execute - Pay with proxy - Multisig", async () => {
		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.50", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("0.50", "ether"));

		await utils.sendMetaTX_Multisig(
			Ident,
			{
				type:  0,
				to:    dest1,
				value: web3.utils.toWei("0.50", "ether"),
				data:  [],
			},
			user2,
			relayer
		);

		assert.equal(await web3.eth.getBalance(Ident.address), web3.utils.toWei("0.00", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("1.00", "ether"));
	});

});
