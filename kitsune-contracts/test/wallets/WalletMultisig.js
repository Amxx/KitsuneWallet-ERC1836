const chai = require('chai');
const ethers = require('ethers');
const { SDK } = require('@kitsune-wallet/sdk/dist/sdk');
const { createMockProvider, deployContract, getWallets, solidity } = require('ethereum-waffle');

const Target = require('../../build/Target');

const testInitialize    = require("../fixtures/testInitialize.js");
const testExecute       = require("../fixtures/testExecute.js");
const testKeyManagement = require("../fixtures/testKeyManagement.js");
const testMultisig      = require("../fixtures/testMultisig.js");
const testUpdateMaster  = require("../fixtures/testUpdateMaster.js");

ethers.errors.setLogLevel('error');

eth = x => ethers.utils.parseEther(x.toString())
describe('Wallet', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const sdk = new SDK(provider, relayer);

	before(async () => {
		targetContract = await deployContract(wallet, Target, []);
	});

	beforeEach(async () => {
		proxy = await sdk.contracts.deployProxy(
			"WalletMultisig",
			[
				[
					sdk.utils.addrToKey(user1.address),
				],
				[
					'0x0000000000000000000000000000000000000000000000000000000000000007',
				],
				1,
				1,
			],
			{ deploy: { allow: true } }
		);
		await wallet.sendTransaction({to: proxy.address, value: eth(1)});
	});

	testInitialize   (sdk, "WalletMultisig");
	testExecute      (sdk, "WalletMultisig");
	testKeyManagement(sdk, "WalletMultisig");
	testMultisig     (sdk, "WalletMultisig");
	testUpdateMaster (sdk, "WalletMultisig");

});
