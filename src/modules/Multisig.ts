import { ethers } from 'ethers';
import * as types from "../types/all";

import { HASHING_METATX, PREPARE_TX, INLINE_TX } from './Meta'

import ModuleBase from "./__ModuleBase";

function toNumber(
	n: types.ethereum.uint256
) : number {
	switch (typeof n)
	{
		case 'number': return n;            break;
		case 'string': return Number(n);    break;
		default:       return n.toNumber(); break;
	}
};

export class Multisig extends ModuleBase
{

	sign(
		proxy:   types.contract,
		signers: types.wallet[],
		metatx:  types.ethereum.metatx,
	) : Promise<types.ethereum.tx>
	{
		var executeABI : string = Object.keys(proxy.interface.functions).filter(fn => fn.startsWith("execute(") && fn !== 'execute(uint256,address,uint256,bytes)')[0]
		return new Promise(function(resolve, reject) {
			proxy.nonce()
			.then((previousNonce: types.ethereum.uint256) => {
				var txFull: types.ethereum.metatx  = PREPARE_TX[executeABI]({ nonce: toNumber(previousNonce) + 1, ...metatx });
				var txHash: types.ethereum.bytes32 = ethers.utils.arrayify(HASHING_METATX[executeABI](proxy.address, txFull));
				Promise.all(signers.sort((a,b) => (a.address == b.address) ? 0 : (a.address > b.address) ? 1 : -1).map(signer => signer.signMessage(txHash)))
				.then(signatures => {
					resolve({ to: proxy.address, data: proxy.interface.functions[executeABI].encode([...INLINE_TX[executeABI](txFull), signatures]) });
				})
				.catch(reject);
			})
			.catch(reject);
		});
	}

	relay(
		tx: types.ethereum.tx,
		config: types.config = {},
	) : Promise<{}>
	{
		return new Promise((resolve, reject) => {
			(config.wallet || this.sdk.wallet || reject(Error("Missing wallet")))
			.sendTransaction({ ...config.options, ...tx }) // TRANSACTION
			.then(resolve)
			.catch(reject);
		});
	}

	execute(
		proxy:   types.contract,
		signers: types.wallet[],
		metatx:  types.ethereum.metatx,
		config:  types.config = {},
	) : Promise<{}>
	{
		return new Promise((resolve, reject) => {
			this.sign(proxy, signers, metatx)
			.then((signed_metatx: types.ethereum.metatx) => {
				this.relay(signed_metatx, config)
				.then(resolve)
				.catch(reject);
			})
			.catch(reject);
		});
	}

	setKey(
		proxy:   types.contract,
		signers: types.wallet[],
		key:     types.ethereum.bytes32,
		purpose: types.ethereum.bytes32,
		config:  types.config = {},
	) : Promise<{}>
	{
		return this.execute(
			proxy,
			signers,
			{
				to: proxy.address,
				data: proxy.interface.functions['setKey(bytes32,bytes32)'].encode([ key, purpose ]),
			},
			config,
		);
	}
}
