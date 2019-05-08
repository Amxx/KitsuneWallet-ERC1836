const chai = require('chai');
const ethers = require('ethers');
const { SDK } = require('@kitsune-wallet/sdk/dist/sdk');
const { createMockProvider, deployContract, getWallets, solidity } = require('ethereum-waffle');

const Target = require('../../build/Target');
const Token  = require('../../contracts/Token');

const testInitialize    = require("../fixtures/testInitialize.js");
const testExecute       = require("../fixtures/testExecute.js");
const testRefund        = require("../fixtures/testRefund.js");
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
		tokenContract  = await deployContract(wallet, Token,  []);
	});

	beforeEach(async () => {
		proxy = await sdk.contracts.deployProxy(
			"WalletMultisigRefund",
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
			{ allowDeploy: true }
		);
		relayerProxy = await sdk.contracts.deployProxy(
			"WalletMultisigRefund",
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
			{ allowDeploy: true }
		);

		await wallet.sendTransaction({to: proxy.address, value: eth(1)});
		await tokenContract.connect(wallet).transfer(proxy.address, eth(1));
	});

	testInitialize   (sdk, "WalletMultisigRefund");
	testExecute      (sdk, "WalletMultisigRefund");
	testRefund       (sdk, "WalletMultisigRefund");
	testKeyManagement(sdk, "WalletMultisigRefund");
	testMultisig     (sdk, "WalletMultisigRefund");
	testUpdateMaster (sdk, "WalletMultisigRefund");

});
