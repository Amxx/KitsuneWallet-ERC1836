const chai = require('chai');
const ethers = require('ethers');
const { SDK } = require('@kitsune-wallet/sdk/dist/sdk');
const { createMockProvider, deployContract, getWallets, solidity } = require('ethereum-waffle');

const Target = require('../../build/Target');
const Token  = require('../../contracts/Token');

const testInitialize           = require("../fixtures/testInitialize.js");
const testENS                  = require('../fixtures/testENS');
const testExecute              = require("../fixtures/testExecute.js");
const testRefund               = require("../fixtures/testRefund.js");
const testKeyManagement        = require("../fixtures/testKeyManagement.js");
const testMultisig             = require("../fixtures/testMultisig.js");
const testOutOfOrder           = require("../fixtures/testOutOfOrder.js");
const testUpdateImplementation = require("../fixtures/testUpdateImplementation.js");

ethers.errors.setLogLevel('error');

eth = x => ethers.utils.parseEther(x.toString())
describe('WalletMultisigRefundOutOfOrder', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const sdk = new SDK(provider, relayer);

	before(async () => {
		targetContract = await deployContract(wallet, Target, []);
		tokenContract  = await deployContract(wallet, Token,  []);
	});

	beforeEach(async () => {
		proxy = await sdk.contracts.deployProxy(
			"WalletMultisigRefundOutOfOrder",
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
			{ deploy: { enable: true } }
		);
		relayerProxy = await sdk.contracts.deployProxy(
			"WalletMultisigRefundOutOfOrder",
			[
				[
					sdk.utils.addrToKey(relayer.address),
				],
				[
					'0x0000000000000000000000000000000000000000000000000000000000000007',
				],
				1,
				1,
			],
			{ deploy: { enable: true } }
		);

		await wallet.sendTransaction({to: proxy.address, value: eth(1)});
		await tokenContract.connect(wallet).transfer(proxy.address, eth(1));
	});

	testInitialize          (sdk, "WalletMultisigRefundOutOfOrder");
	testENS                 (sdk, "WalletMultisigRefundOutOfOrder");
	testExecute             (sdk, "WalletMultisigRefundOutOfOrder");
	testRefund              (sdk, "WalletMultisigRefundOutOfOrder");
	testKeyManagement       (sdk, "WalletMultisigRefundOutOfOrder");
	testOutOfOrder          (sdk, "WalletMultisigRefundOutOfOrder");
	testMultisig            (sdk, "WalletMultisigRefundOutOfOrder");
	testUpdateImplementation(sdk, "WalletMultisigRefundOutOfOrder");

});
