const chai = require('chai');
const ethers = require('ethers');
const { SDK } = require('@kitsune-wallet/sdk/dist/sdk');
const { MockProvider, deployContract, solidity } = require('ethereum-waffle');

const Target = require('../../build/Target');

const testInitialize           = require("../fixtures/testInitialize.js");
const testENS                  = require('../fixtures/testENS');
const testExecute              = require("../fixtures/testExecute.js");
const testKeyManagement        = require("../fixtures/testKeyManagement.js");
const testMultisig             = require("../fixtures/testMultisig.js");
const testUpdateImplementation = require("../fixtures/testUpdateImplementation.js");

ethers.errors.setLogLevel('error');

eth = x => ethers.utils.parseEther(x.toString())
describe('WalletMultisigV2', () => {

	// const provider = new MockProvider({ hardfork: 'istanbul' }); // TODO: fix istanbul
	const provider = new MockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = provider.getWallets();
	const sdk = new SDK(provider, relayer);

	before(async () => {
		walletContract = await sdk.contracts.getActiveInstance("WalletMultisigV2", { deploy: { enable: true } });
		targetContract = await deployContract(wallet, Target, []);
	});

	beforeEach(async () => {
		proxy = await sdk.contracts.deployProxy(
			"WalletMultisigV2",
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
		await wallet.sendTransaction({to: proxy.address, value: eth(1)});
	});

	testInitialize          (sdk, "WalletMultisigV2");
	testENS                 (sdk, "WalletMultisigV2");
	testExecute             (sdk, "WalletMultisigV2");
	testKeyManagement       (sdk, "WalletMultisigV2");
	testMultisig            (sdk, "WalletMultisigV2");
	testUpdateImplementation(sdk, "WalletMultisigV2");

});
