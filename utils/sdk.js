const { ethers } = require('ethers');

const IMaster                        = require(`../build-minified/IMaster`);
const Proxy                          = require(`../build-minified/Proxy`);
const WalletOwnable                  = require(`../build-minified/WalletOwnable`);
const WalletMultisig                 = require(`../build-minified/WalletMultisig`);
const WalletMultisigRefund           = require(`../build-minified/WalletMultisigRefund`);
const WalletMultisigRefundOutOfOrder = require(`../build-minified/WalletMultisigRefundOutOfOrder`);

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

const CONTRACTS = {
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
		this.contracts      = CONTRACTS;
		this.defaultRelayer = defaultRelayer;
	}

	deployContract(name, args, relayer = null)
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

	getMasterInstance(name, relayer = null)
	{
		let sdk      = this;
		let contract = this.contracts[name];
		let sender   = relayer || this.defaultRelayer;

		return new Promise(function(resolve, reject) {
			sdk.provider.getNetwork()
			.then(network => {
				if (contract.networks[network.chainId] === undefined)
				{
					sdk.deployContract(name, [], sender)
					.then(instance => {
						contract.networks[network.chainId] = {
						  "events": {}
						, "links": {}
						, "address": instance['address']
						, "transactionHash": instance['deployTransaction'].hash
						};
						resolve(instance);
					})
					.catch(reject);
				}
				else
				{
					resolve(sdk.viewContract(name, contract.networks[network.chainId].address));
				}
			})
			.catch(reject);
		})
	}

	deployProxy(name, args, relayer = null, params = {})
	{
		let sdk    = this;
		let master = name;

		return new Promise(function(resolve, reject) {
			sdk.getMasterInstance(master, relayer)
			.then(instance => {
				sdk.deployContract("Proxy", [ instance.address, sdk.makeInitializationTx(master, args) ])
				.then(proxy => {
					resolve(sdk.viewContract(master, proxy.address));
				})
				.catch(reject);
			})
			.catch(reject);
		});
	}

	makeInitializationTx(name, args)
	{
		return new ethers.utils.Interface(this.contracts[name].abi).functions.initialize.encode(args);
	}

	makeUpdateTx(args)
	{
		return new ethers.utils.Interface(IMaster.abi).functions.updateMaster.encode(args);
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
				let txFull = PREPARE_TX[executeABI]({ nonce: previousNonce.toNumber() + 1, ...tx });
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

	addrToKey(address)
	{
		return ethers.utils.hexZeroPad(address, 32).toString().toLowerCase();
	}


	setKey(proxy, key, purpose, signers, relayer = null, params = {})
	{
		let sdk  = this;
		let args = { proxy, key, purpose, signers, relayer, params };

		return new Promise(function(resolve, reject) {
			sdk.prepareMetaTx(
				args.proxy,
				{
					to: args.proxy.address,
					data: args.proxy.interface.functions['setKey(bytes32,bytes32)'].encode([ args.key, args.purpose ])
				},
				args.signers
			)
			.then(txData => {
				sdk.relayMetaTx(txData, args.relayer, args.params)
				.then(resolve)
				.catch(reject);
			})
			.catch(reject);
		});
	}
}


module.exports = { Sdk }
