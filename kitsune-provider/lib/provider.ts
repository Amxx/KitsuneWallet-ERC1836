import { ethers } from 'ethers';
import { SDK, types } from '@kitsune-wallet/sdk/dist/sdk';

export class ProxySigner extends ethers.Signer
{
	provider: types.Provider;
	_sdk:     SDK;
	_proxy:   types.contract;
	_signer:  types.wallet;
	_relayer: types.wallet;

	constructor(
		proxyName:    string,
		proxyAddress: types.ethereum.address,
		signer:       types.wallet,
		relayer:      types.wallet = null,
	)
	{
		super();
		this._signer  = signer;
		this._relayer = relayer || signer;
		this.provider = this._relayer.provider;
		this._sdk     = new SDK(this.provider, this._relayer);
		this._proxy   = this._sdk.contracts.viewContract(proxyName, proxyAddress);
	}

	getAddress()
	{
		return this._proxy.address;
	}

	signMessage(message)
	{
		// TODO: check that signer has the right purpose (0x4)
		return this._signer.signMessage(message);
	}

	async sendTransaction(transaction)
	{
		return this._sdk.multisig.execute(
			this._proxy,
			[ this._signer ],
			{
				to:    await transaction.to,
				value: await transaction.value || 0,
				data:  await transaction.data  || "0x",
			}
		);
	}
}
