const chai   = require('chai');
const ethers = require('ethers');
const {createMockProvider, deployContract, getWallets, solidity} = require('ethereum-waffle');
const {sendMetaTx} = require('../../utils/utils.js');

const Proxy  = require('../../build/Proxy');
const Wallet = require('../../build/IexecWhitelist');
const Target = require('../../build/Target');

const testInitialize    = require("../fixtures/testInitialize.js");
const testExecute       = require("../fixtures/testExecute.js");
const testKeyManagement = require("../fixtures/testKeyManagement.js");
const testMultisig      = require("../fixtures/testMultisig.js");
const testUpdateMaster  = require("../fixtures/testUpdateMaster.js");

ethers.errors.setLogLevel('error');

eth = x => ethers.utils.parseEther(x.toString())
describe('IexecWhitelist', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const addrToKey = addr => ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode([ 'address' ],[ addr ]));

	before(async () => {
		walletContract = await deployContract(wallet, Wallet, []);
		targetContract = await deployContract(wallet, Target, []);
	});

	beforeEach(async () => {
		proxyContract = await deployContract(wallet, Proxy, [
			walletContract.address,
			walletContract.interface.functions.initialize.encode([
				[
					addrToKey(user1.address),
				],
				[
					'0x0000000000000000000000000000000000000000000000000000000000000007',
				],
				1,
				1,
			])
		]);
		proxyAsWallet = new ethers.Contract(proxyContract.address, Wallet.abi, provider);

		await wallet.sendTransaction({to: proxyAsWallet.address, value: eth(1)});
	});

	testInitialize   (provider, 'execute(uint256,address,uint256,bytes,uint256,bytes[])', addrToKey);
	testExecute      (provider, 'execute(uint256,address,uint256,bytes,uint256,bytes[])', addrToKey);
	testKeyManagement(provider, 'execute(uint256,address,uint256,bytes,uint256,bytes[])', addrToKey);
	testMultisig     (provider, 'execute(uint256,address,uint256,bytes,uint256,bytes[])', addrToKey);
	testUpdateMaster (provider, 'execute(uint256,address,uint256,bytes,uint256,bytes[])', addrToKey);

});
