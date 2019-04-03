const chai   = require('chai');
const ethers = require('ethers');
const {createMockProvider, deployContract, getWallets, solidity} = require('ethereum-waffle');
const {sendMetaTx} = require('../utils.js')

const Proxy  = require('../../build/Proxy');
const Wallet = require('../../build/WalletMultisigRefund');
const Target = require('../../build/Target');

const testInitialize    = require("../fixtures/testInitialize.js");
const testExecute       = require("../fixtures/testExecute.js");
const testKeyManagement = require("../fixtures/testKeyManagement.js");
const testMultisig      = require("../fixtures/testMultisig.js");
const testUpdateMaster  = require("../fixtures/testUpdateMaster.js");

const executeabi   = 'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])';
const executeextra = [ "0x0000000000000000000000000000000000000000", 0 ];

ethers.errors.setLogLevel('error');

describe('Wallet', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);

	before(async () => {
		walletContract = await deployContract(wallet, Wallet, []);
		targetContract = await deployContract(wallet, Target, []);
	});

	beforeEach(async () => {
		proxyContract = await deployContract(wallet, Proxy, [
			walletContract.address,
			walletContract.interface.functions.initialize.encode([
				[
					ethers.utils.keccak256(user1.address),
				],
				[
					'0x0000000000000000000000000000000000000000000000000000000000000007',
				],
				1,
				1,
			])
		]);
		proxyAsWallet = new ethers.Contract(proxyContract.address, Wallet.abi, provider);

		await wallet.sendTransaction({to: proxyAsWallet.address, value: 1000});
	});

	testInitialize   (provider, executeabi, executeextra);
	testExecute      (provider, executeabi, executeextra);
	testKeyManagement(provider, executeabi, executeextra);
	testMultisig     (provider, executeabi, executeextra);

});
