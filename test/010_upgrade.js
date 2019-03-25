const Proxy             = artifacts.require("Proxy");
const WalletOwnable  = artifacts.require("WalletOwnable");
const WalletMultisig = artifacts.require("WalletMultisig");
const TargetContract           = artifacts.require("TargetContract");

const { shouldFail } = require('openzeppelin-test-helpers');
const utils          = require('./utils.js');

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

contract('upgrade', async (accounts) => {

	assert.isAtLeast(accounts.length, 10, "should have at least 10 accounts");
	relayer = accounts[0];
	user1   = accounts[1];
	user2   = accounts[2];

	var ident = null;
	var dest1 = web3.utils.randomHex(20);

	/***************************************************************************
	 *                        Environment configuration                        *
	 ***************************************************************************/
	before("configure", async () => {
		console.log("# web3 version:", web3.version);
		Target = await TargetContract.deployed();
	});

	it ("Create proxy", async () => {
		let { address } = await Proxy.new(
			(await WalletOwnable.deployed()).address,
			utils.prepareData(WalletOwnable, "initialize", [
				user1
			]),
			{ from: relayer }
		);
		ident = await WalletOwnable.at(address);
	});

	it ("Verify proxy initialization", async () => {
		assert.equal(await ident.owner(), user1);
	});

	it("Deposit on proxy", async () => {
		assert.equal(await web3.eth.getBalance(ident.address), 0);

		txMined = await ident.send(web3.utils.toWei("1.00", "ether"), { from: user1 });

		assert.equal(await web3.eth.getBalance(ident.address), web3.utils.toWei("1.00", "ether"));
	});

	it("Execute - Pay with proxy - Basic", async () => {
		assert.equal(await web3.eth.getBalance(ident.address), web3.utils.toWei("1.00", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("0.00", "ether"));

		txMined = await ident.execute(
			0,
			dest1,
			web3.utils.toWei("0.50", "ether"),
			"0x",
			{ from: user1 }
		);

		assert.equal(await web3.eth.getBalance(ident.address), web3.utils.toWei("0.50", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("0.50", "ether"));
	});

	it("updateMaster", async () => {
		await ident.execute(
			0,
			ident.address,
			0,
			utils.prepareData(WalletOwnable, "updateMaster", [
				(await WalletMultisig.deployed()).address,
				utils.prepareData(WalletMultisig, "initialize", [
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
				]),
				true
			]),
			{ from: user1 }
		);
		ident = await WalletMultisig.at(ident.address);
	});

	it ("Verify proxy initialization", async () => {
		assert.isTrue (await ident.keyHasPurpose(utils.addressToBytes32(user1), "0x0000000000000000000000000000000000000000000000000000000000000001"));
		assert.isTrue (await ident.keyHasPurpose(utils.addressToBytes32(user1), "0x0000000000000000000000000000000000000000000000000000000000000002"));
		assert.isTrue (await ident.keyHasPurpose(utils.addressToBytes32(user1), "0x0000000000000000000000000000000000000000000000000000000000000004"));
		assert.isFalse(await ident.keyHasPurpose(utils.addressToBytes32(user2), "0x0000000000000000000000000000000000000000000000000000000000000001"));
		assert.isTrue (await ident.keyHasPurpose(utils.addressToBytes32(user2), "0x0000000000000000000000000000000000000000000000000000000000000002"));
		assert.isTrue (await ident.keyHasPurpose(utils.addressToBytes32(user2), "0x0000000000000000000000000000000000000000000000000000000000000004"));
	});

	it("Execute - Pay with proxy - Multisig", async () => {
		assert.equal(await web3.eth.getBalance(ident.address), web3.utils.toWei("0.50", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("0.50", "ether"));

		await utils.sendMetaTX_Multisig(
			ident,
			{
				type:  0,
				to:    dest1,
				value: web3.utils.toWei("0.50", "ether"),
				data:  [],
			},
			user2,
			relayer
		);

		assert.equal(await web3.eth.getBalance(ident.address), web3.utils.toWei("0.00", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("1.00", "ether"));
	});

});
