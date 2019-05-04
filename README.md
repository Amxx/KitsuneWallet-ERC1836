# **Kitsune Wallet**

This documentation is for version 0.0.24, please sumbit an issue if you feel like an update is required.



## What is Kitsune Wallet

#### Can you talk about the genesis of Kitsune?  What problem are you trying to solve?

As most people involved in the development of blockchain projects, I realized UX is a major issue right now. This led me to follow the existing effort on identity smart contracts and meta-transactions. I realized that there is a lot of effort duplication which is leading to incompatible solutions. It is also clear that no solution is future proof.

Rather than coming up with a new competing solution, I decided to experiment with my knowledge of contract upgradability to build a solution that is simple enough to be adopted straight away but with the ability to upgrade to any existing or future standard.

#### Why do you call it Kitsune?

To me, an upgradeable identity smart contract is like a mythical creature that would watch over your assets while being able to change shape so it would always friendly. I am a fan of Asian (and more particularly Japanese) culture, so the reference to the mystical shapeshifting fox was obvious.

#### Can you explain why is Kitsune significant?

Kitsune wallet can be significant in many ways. First, it is designed to help wallet developers use proxies more easily. This will improve memory usage on the blockchain. In addition, Kistune makes these proxy upgradeable, so if the wallet logic as an error, or is missing a feature, you can upgrade in a single transaction that preserves your address (along with all the claims attached to it). Last but not least, being able to upgrade your proxy also means you are able to completely change the interface, so a user is not locked with the project that deployed the proxy in the first place.

My hope is that a Kitsune wallet proxy, can be your sole on-chain identity, that you will keep for the rest of your life, and transmit to your next of kin.

#### Can you talk about the technical architecture of Kitsune?

Technical architecture can quickly be very complex, particularly when talking of upgradeable smart contracts. The thing is, ethereum smart contracts have their code (the logic they are going to execute) and their memory (the data they hold). Contracts also have the ability to call another contract or to perform a delegatecall. Calls are simple as they move the context to another contract, asking it to perform some operation using its own code and memory. Delegate calls are different in the sense that they are executing the targeted contract’s code but using the memory of the caller. This is how libraries work. Using the same pattern Kitsune wallet deployed proxy that contains a minimum of code and uses delegate calls to a master for all the complex wallet logic. This means a single master can serve millions of users, each one of them only needs a lightweight proxy. By simply changing the master a proxy is using, you completely reshape the proxy capabilities. This is how most upgradeable contracts work.

The added value of Kitsune is the way masters are structured, and the way they deal with memory. Kitsune wallet prevents the proxy from linking to dangerous masters and requires the masters to include specific methods for memory cleanup and replay protection through upgrades.



## Existing Masters

#### `WalletOwnable`

`WalletOwnable` is a very simple master that provide simple ownership. There is no multisig feature here, as a single address controles the wallet. Using this master turns the kitsune-wallet proxy into a simple ERC725 and ERC1271 compatible proxy (with the added upgradability mechanism).

Methods includes:

| Function name       | arguments                                 | returns        | view | Comment                                                       |
|:--------------------|:------------------------------------------|:---------------|:----:|:--------------------------------------------------------------|
| `master`            | ()                                        | (address)      | Yes  | KitsuneWallet: get master address                             |
| `updateMaster`      | (address,bytes calldata,bool)             |                | No   | KitsuneWallet: update master                                  |
| `transferOwnership` | (address)                                 |                | No   | Wallet specific: change ownership of the contract             |
| `renounceOwnership` | ()                                        |                | No   | Wallet specific: remove owner /!\ Will lock the proxy forever |
| `execute`           | (uint256, address, uint256, bytes memory) |                | No   | Wallet specific: execute transaction                          |
| `owner`             | ()                                        | (address)      | Yes  | (ERC725v2 compatibility & Wallet): owner                      |
| `setData`           | (bytes32, bytes calldata)                 |                | No   | (ERC725v2 compatibility)                                      |
| `getData`           | (bytes32)                                 | (bytes memory) | Yes  | (ERC725v2 compatibility)                                      |
| `isValidSignature`  | (bytes32, bytes memory)                   | (bool)         | Yes  | (ERC1271 compatibility)                                       |

#### `WalletMultisig`

`WalletMultisig` is a multisig master that provide complexe ownership pattern. It relies on a key-value store to record the purpose of the various key. A key with purpose `0x0` has no right. Purposes are encoded as a bit-mask, meaning up to 256 purposes can individually be enabled/disabled for each key.

- Purpose `0x1` is management right (key can participate to actions updating the proxy, such as adding or removing keys)
- Purpose `0x2` is action right (key can participate to actions on external contract, such as ether & token transfers, contract creations, ...)
- Purpose `0x4` is signature right (key can sign messages that will be recognised as valid by the ERC1271 method `isValidSignature`)

Calls to the execute method can be perform by anyone, but the subsequent calls will only be performed if the meta-transaction is signed by authorized accounts. Anyone sending signed meta-transaction is refered to as a relayer.

Methods includes:

| Function name            | arguments                                                          | returns            | view | Comment                                                                      |
|:-------------------------|:-------------------------------------------------------------------|:-------------------|:----:|:-----------------------------------------------------------------------------|
| `master`                 | ()                                                                 | (address)          | Yes  | KitsuneWallet: get master address                                            |
| `updateMaster`           | (address,bytes calldata,bool)                                      |                    | No   | KitsuneWallet: update master                                                 |
| `addrToKey`              | (address)                                                          | (bytes32)          | Yes  | Wallet specific: convert address to key                                      |
| `nonce`                  | ()                                                                 | (uint256)          | Yes  | Wallet specific: meta nonce for replay protection                            |
| `getActiveKeys`          | ()                                                                 | (bytes32[] memory) | Yes  | Wallet specific: list of all the keys with any purpose                       |
| `getKey`                 | (bytes32)                                                          | (bytes32)          | Yes  | Wallet specific: Get a key entire purpose                                    |
| `getKey`                 | (address)                                                          | (bytes32)          | Yes  | Wallet specific: Get a key entire purpose                                    |
| `keyHasPurpose`          | (bytes32, bytes32)                                                 | (bool)             | Yes  | Wallet specific: Check if a key as the required purposes                     |
| `keyHasPurpose`          | (bytes32, uint256)                                                 | (bool)             | Yes  | Wallet specific: Check if a key as the required purposes                     |
| `keyHasPurpose`          | (address, bytes32)                                                 | (bool)             | Yes  | Wallet specific: Check if a key as the required purposes                     |
| `keyHasPurpose`          | (address, uint256)                                                 | (bool)             | Yes  | Wallet specific: Check if a key as the required purposes                     |
| `setKey`                 | (bytes32, bytes32)                                                 |                    | No   | Wallet specific: Change the purpose associated with a key                    |
| `setKey`                 | (bytes32, uint256)                                                 |                    | No   | Wallet specific: Change the purpose associated with a key                    |
| `setKey`                 | (address, bytes32)                                                 |                    | No   | Wallet specific: Change the purpose associated with a key                    |
| `setKey`                 | (address, uint256)                                                 |                    | No   | Wallet specific: Change the purpose associated with a key                    |
| `execute`                | (uint256, address, uint256, bytes memory, uint256, bytes[] memory) |                    | No   | Wallet specific: Execute a transaction (must be signed with authorized keys) |
| `managementKeyCount`     | ()                                                                 | (uint256)          | Yes  | Wallet specific: Number of keys with management purpose                      |
| `getActionThreshold`     | ()                                                                 | (uint256)          | Yes  | Wallet specific: Number of keys required to perform an action                |
| `getManagementThreshold` | ()                                                                 | (uint256)          | Yes  | Wallet specific: Number of keys required to perform management               |
| `setActionThreshold`     | (uint256)                                                          |                    | No   | Wallet specific: CHange the action threshold                                 |
| `setManagementThreshold` | (uint256)                                                          |                    | No   | Wallet specific: CHange the management threshold                             |
| `owner`                  | ()                                                                 | (address)          | Yes  | (ERC725v2 compatibility) proxy is owned by itself                            |
| `setData`                | (bytes32, bytes calldata)                                          |                    | No   | (ERC725v2 compatibility)                                                     |
| `getData`                | (bytes32)                                                          | (bytes memory)     | Yes  | (ERC725v2 compatibility)                                                     |
| `isValidSignature`       | (bytes32, bytes memory)                                            | (bool)             | Yes  | (ERC1271 compatibility)                                                      |

#### `WalletMultisigRefund`

`WalletMultisigRefund` is a extention to `WalletMultisig` that includes a feature to refund the relayer to cover the gas cost. The refund can be done in ether or using an ERC20 token.

Methods are the same as `WalletMultisig` except for the `execute` method that supports the modification in the meta-transaction.

| Function name            | arguments                                                                            | returns | view | Comment                                                                      |
|:-------------------------|:-------------------------------------------------------------------------------------|:--------|:----:|:-----------------------------------------------------------------------------|
| `execute`                | (uint256, address, uint256, bytes memory, uint256, address, uint256, bytes[] memory) |         | No   | Wallet specific: Execute a transaction (must be signed with authorized keys) |

#### `WalletMultisigRefundOutOfOrder`

`WalletMultisigRefundOutOfOrder` is a extention to `WalletMultisigRefund` that includes a feature to perform transaction out-of-order. In this case the meta-nonce is replaced by a salt to perform replay protection.

Methods are the same as `WalletMultisig` and `WalletMultisigRefund` except for the `execute` method that supports the modification in the meta-transaction.

| Function name            | arguments                                                                                     | returns | view | Comment                                                                      |
|:-------------------------|:----------------------------------------------------------------------------------------------|:--------|:----:|:-----------------------------------------------------------------------------|
| `execute`                | (uint256, address, uint256, bytes memory, uint256, bytes32, address, uint256, bytes[] memory) |         | No   | Wallet specific: Execute a transaction (must be signed with authorized keys) |

#### Meta-transactions signature

Meta-transaction used by the `WalletMultisig`, `WalletMultisigRefund` and `WalletMultisigRefundOutOfOrder` follow a common pattern:

| Name          | Type    | Used by `WM` | Used by `WMR` | Used by `WMROOO` | Comment                                                                     |
|:--------------|:--------|:------------:|:-------------:|:----------------:|:----------------------------------------------------------------------------|
| operationType | uint256 | x            | x             | x                | `0` call, `1` create contract                                               |
| to            | address | x            | x             | x                | Destination of the call                                                     |
| value         | uint256 | x            | x             | x                | Value of the call (wei transfered)                                          |
| data          | bytes   | x            | x             | x                | Data of the call                                                            |
| nonce         | uint256 | x            | x             | x                | Meta-nonce (replay protection)                                              |
| salt          | bytes32 |              |               | x                | Salt for replay protection of out-of-order meta-transaction                 |
| gasToken      | address |              | x             | x                | Address of the ERC20 token to use for gas refund (or 0 for refund in ether) |
| gasPrice      | uint256 |              | x             | x                | Gas price for the refund (in ERC20 token or ether)                          |
| sigs          | bytes[] | x            | x             | x                | Signatures of the meta-transaction by authorized keys                       |

* Use `nonce = 0` for out-of-order transactions protected by salt (`WalletMultisigRefundOutOfOrder` only)

If multiple signatures must be required for an action, the different signatures must be ordered following the increassing order of the signing addresses. For more details about meta-transaction hashing and signature, please refer to `utils/utils.js` and to the different tests.


## Writting a new Master

In order to be a Kitsune compatible master, your contract must follow some rules:

1. Inherit from `contracts/masters/MasterBase.sol` as it's FIRST dependency. This is required to ensure the correct memory space is reserved at the beginning of the contract.
2. Implement the `function updateMaster(address,bytes calldata,bool) external` function (declared but not defined in `MasterBase`). This function reset the memory specific to your wallet (if the boolean is enabled) and then call `setMaster(_newMaster, _initData)`. Failure to include this function will prevent further upgradability of the proxy using your master.
3. Implement an initialization function that will be called as part of the update process.

`WalletOwnable` provides a simple example. UniversalLogin also provides an exemple in its [WalletMaster](https://github.com/UniversalLogin/UniversalLoginSDK/blob/master/universal-login-contracts/contracts/WalletMaster.sol) contract.

## Deploying a proxy

Example of code used to deploy a proxy base on the `WalletMultisig` master controlled by two keys.

```
const ethers = require('ethers');
const proxy  = require('./build/Proxy')
const master = require('./build/WalletMultisig');

initializationTX = new ethers.utils.Interface(master.abi).functions.initialize.encode([
	[
		ethers.utils.hexZeroPad(<managment_key_1>, 32).toString().toLowerCase(), // addrToKey(<managment_key_1>)
		ethers.utils.hexZeroPad(<managment_key_2>, 32).toString().toLowerCase(), // addrToKey(<managment_key_2>)
	],
	[
		"0x0000000000000000000000000000000000000000000000000000000000000003", // purpose: management & action
		"0x0000000000000000000000000000000000000000000000000000000000000003", // purpose: management & action
	],
	1, // Only one signature needed for management
	1, // Only one signature needed for action
]);
new ethers.ContractFactory(proxy.abi, proxy.bytecode).getDeployTransaction(master.networks['42'].address, initializationTX);
```

## Using a proxy

To use a proxy, just instanciate a example of the master it uses (can be verified using the `master()` view method) at the address of the proxy. The proxy will transparently redirect all calls and results.

## Upgrading a proxy

To upgrade a proxy to a new master, call the `updateMaster(address,bytes calldata,bool)` method implemented by the master. If both master use the same memory pattern you could eventually disregard the initialization step.

**Example:** upgrading from `WalletOwnable` to `WalletMultisig` (with the same ownership):

```
const ethers = require('ethers');
const utils  = require('./utils/utils');

const newMasterId = "WalletMultisig";

const proxyaddr   = <address of the proxy>;
const master      = require(`./build/${newMasterId}`);
const wallet      = new ethers.Wallet(<private key of manager>);
const proxy       = new ethers.Contract(proxyaddr, master.abi, wallet);

initializationTX = new ethers.utils.Interface(master.abi).functions.initialize.encode([
	[ ethers.utils.hexZeroPad(wallet.address, 32).toString().toLowerCase() ],
	[ "0x0000000000000000000000000000000000000000000000000000000000000003" ],
	1,
	1,
]);
updateMasterTX = new ethers.utils.Interface(master.abi).functions.updateMaster.encode([
	master.networks["42"].address,
	initializationTX,
	true,
]);

await proxy.functions['execute(uint256,address,uint256,bytes)'](1, proxy.address, 0, updateMasterTX);
```

**Example:** upgrading from `WalletMultisig` to `WalletMultisigRefundOutOfOrder` (with no memory reset):

```
const ethers = require('ethers');
const utils  = require('./utils/utils');

const newMasterId = "WalletMultisigRefundOutOfOrder";

const proxyaddr   = <address of the proxy>;
const master      = require(`./build/${newMasterId}`);
const wallet      = new ethers.Wallet(<private key of manager>);
const proxy       = new ethers.Contract(proxyaddr, master.abi, wallet);
const executeABI  = Object.keys(proxy.interface.functions)
	.filter(fn => fn.startsWith("execute("))
	.filter(fn => fn !== 'execute(uint256,address,uint256,bytes)')[0]

await utils.relayMetaTx(
	await prepareMetaTx(
		proxy,
		{
			to: proxy.address,
			data: proxy.interface.functions.updateMaster.encode([
				master.address,
				"0x",
				false,
			]),
			nonce: (await proxy.nonce()) + 1,
		}
		[ wallet ],
		executeABI
	),
	relayer
)
```
