const chai = require('chai');
const ethers = require('ethers');
const { SDK } = require('@kitsune-wallet/sdk/dist/sdk');
const { MockProvider, deployContract, solidity } = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);
ethers.errors.setLogLevel('error');

eth = x => ethers.utils.parseEther(x.toString())
describe('ContractType', () => {

	const provider = new MockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = provider.getWallets();
	const sdk = new SDK(provider, relayer);

	const makeInitializeArgs = key => [[sdk.utils.addrToKey(key)],['0x0000000000000000000000000000000000000000000000000000000000000007'],1,1]

	before(async () => {
		walletContract = await sdk.contracts.getActiveInstance("WalletMultisig", { deploy: { enable: true } });
	});

	beforeEach(async () => {
		proxy        = await sdk.contracts.deployProxy("WalletMultisig", makeInitializeArgs(user1.address));
		anotherProxy = await sdk.contracts.deployProxy("WalletMultisig", makeInitializeArgs(user1.address));
	});

	describe('Verify contract type', async () => {

		it('Can use a master as an implementation', async () => {
			await expect(sdk.contracts.deployContract("Proxy", [
				walletContract.address,
				sdk.transactions.initialization("WalletMultisig", makeInitializeArgs(user1.address))
			])).to.not.reverted;
		});

		it('Cant use another proxy as an implementation', async () => {
			await expect(sdk.contracts.deployContract("Proxy", [
				anotherProxy.address,
				sdk.transactions.initialization("WalletOwnable", [ user1.address ])
			// ])).to.be.revertedWith("invalid-master-implementation");
			])).to.be.reverted; // TODO: check error message
		});

		it('Cant upgrade using another proxy as an implementation', async () => {
			await expect(proxy.connect(user1).updateImplementation(
				anotherProxy.address,
				sdk.transactions.initialization("WalletMultisig", makeInitializeArgs(user2.address)),
				true,
				{ gasLimit: 800000 }
			)).to.be.reverted; // TODO
			// )).to.be.revertedWith("invalid-master-implementation");
		});

		it('Cant upgrade a proxy to use itself', async () => {
			await expect(proxy.connect(user1).updateImplementation(
				proxy.address,
				sdk.transactions.initialization("WalletMultisig", makeInitializeArgs(user2.address)),
				true,
				{ gasLimit: 800000 }
			)).to.be.reverted; // TODO
			// )).to.be.revertedWith("invalid-master-implementation");
		});

	});

});
