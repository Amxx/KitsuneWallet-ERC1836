const { ethers } = require('ethers');

const HASHING_METATX = {
	'execute(uint256,address,uint256,bytes,uint256,bytes[])': function (proxyAddress, tx)
	{
		return ethers.utils.solidityKeccak256([
				'address',
				'uint256',
				'address',
				'uint256',
				'bytes32',
				'uint256',
			],[
				proxyAddress,
				tx.type,
				tx.to,
				tx.value,
				ethers.utils.keccak256(tx.data),
				tx.nonce,
		]);
	},
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': function (proxyAddress, tx)
	{
		return ethers.utils.solidityKeccak256([
				'address',
				'uint256',
				'address',
				'uint256',
				'bytes32',
				'uint256',
				'address',
				'uint256',
			],[
				proxyAddress,
				tx.type,
				tx.to,
				tx.value,
				ethers.utils.keccak256(tx.data),
				tx.nonce,
				tx.gasToken,
				tx.gasPrice,
		]);
	},
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': function (proxyAddress, tx)
	{
		return ethers.utils.solidityKeccak256([
				'address',
				'uint256',
				'address',
				'uint256',
				'bytes32',
				'uint256',
				'bytes32',
				'address',
				'uint256',
			],[
				proxyAddress,
				tx.type,
				tx.to,
				tx.value,
				ethers.utils.keccak256(tx.data),
				tx.nonce,
				tx.salt,
				tx.gasToken,
				tx.gasPrice,
		]);
	},
};

const PREPARE_TX = {
	'execute(uint256,address,uint256,bytes,uint256,bytes[])': function (tx)
	{
		return {type:0,value:0,data:[], ...tx};
	},
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': function (tx)
	{
		return {type:0,value:0,data:[],gasToken:"0x0000000000000000000000000000000000000000",gasPrice:0, ...tx};
	},
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': function (tx)
	{
		return {type:0,value:0,data:[],gasToken:"0x0000000000000000000000000000000000000000",gasPrice:0,salt:ethers.utils.randomBytes(32), ...tx};
	},
};

const INLINE_TX = {
	'execute(uint256,address,uint256,bytes,uint256,bytes[])': function (tx)
	{
		return [ tx.type, tx.to, tx.value, tx.data, tx.nonce ]
	},
	'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])': function (tx)
	{
		return [ tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.gasToken, tx.gasPrice ]
	},
	'execute(uint256,address,uint256,bytes,uint256,bytes32,address,uint256,bytes[])': function (tx)
	{
		return [ tx.type, tx.to, tx.value, tx.data, tx.nonce, tx.salt, tx.gasToken, tx.gasPrice ]
	},
};

const Proxy                          = require(`../build/Proxy`);
const WalletOwnable                  = require(`../build/WalletOwnable`);
const WalletMultisig                 = require(`../build/WalletMultisig`);
const WalletMultisigRefund           = require(`../build/WalletMultisigRefund`);
const WalletMultisigRefundOutOfOrder = require(`../build/WalletMultisigRefundOutOfOrder`);

const contracts = {
	"Proxy":                          Proxy
, "WalletOwnable":                  WalletOwnable
, "WalletMultisig":                 WalletMultisig
, "WalletMultisigRefund":           WalletMultisigRefund
, "WalletMultisigRefundOutOfOrder": WalletMultisigRefundOutOfOrder
}






class Sdk
{
	constructor(provider = null, defaultRelayer = null)
	{
		this.provider       = provider || new ethers.providers.JsonRpcProvider();
		this.contracts      = contracts;
		this.masterList     = Object.keys(contracts).filter(name => name !== "Proxy");
		this.defaultRelayer = defaultRelayer;
	}

	async deployContract(name, args, relayer = null)
	{
		let contract = this.contracts[name];
		let sender   = relayer || this.defaultRelayer;

		return new Promise(function(resolve, reject) {
			(new ethers.ContractFactory(contract.abi, contract.bytecode, sender))
			.deploy(...args)
			.then(
				instance => instance.deployed()
				.then(resolve)
				.catch(reject)
			)
			.catch(reject)
		});
	}

	makeInitializationTx(name, args)
	{
		return new ethers.utils.Interface(this.contracts[name].abi).functions.initialize.encode(args);
	}

	makeUpdateTx(name, args)
	{
		return new ethers.utils.Interface(this.contracts[name].abi).functions.updateMaster.encode(args);
	}

	viewContract(name, address)
	{
		return new ethers.Contract(address, this.contracts[name].abi, this.provider);
	}

	relayMetaTx(txData, relayer = null, params = {})
	{
		return (relayer || this.defaultRelayer).sendTransaction({ ...txData, gasLimit: 1000000, ...params });
	}

	prepareMetaTx(proxy, tx, signers = [])
	{
		let executeABI = Object.keys(proxy.interface.functions).filter(fn => fn.startsWith("execute(") && fn !== 'execute(uint256,address,uint256,bytes)')[0]
		return new Promise(function(resolve, reject) {
			proxy.nonce()
			.then(previousNonce => {
				let txFull = PREPARE_TX[executeABI]({ nonce: previousNonce + 1, ...tx });
				let txHash = ethers.utils.arrayify(HASHING_METATX[executeABI](proxy.address, txFull));
				Promise.all(signers.sort((a,b) => a.address-b.address).map(signer => signer.signMessage(txHash)))
				.then(signatures => {
					resolve({ to: proxy.address, data: proxy.interface.functions[executeABI].encode([...INLINE_TX[executeABI](txFull), signatures]) });
				})
				.catch(reject);
			})
			.catch(reject);
		});
	}
}


module.exports = { Sdk }
