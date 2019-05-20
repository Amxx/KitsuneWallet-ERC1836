import { ethers } from 'ethers';
import { SDK, types } from '@kitsune-wallet/sdk/dist/sdk';

export class ProxySigner extends ethers.Signer
{
	provider: types.Provider;
	_sdk:     SDK;
	_proxy:   types.contract;

	constructor(
		proxyName:    string,
		proxyAddress: types.ethereum.address,
		wallet:       types.wallet,
	)
	{
		super();
		this.provider = wallet.provider;
		this._sdk     = new SDK(wallet.provider, wallet);
		this._proxy   = this._sdk.contracts.viewContract(proxyName, proxyAddress);
	}

	getAddress()
	{
		return this._sdk.wallet.address;
	}

	signMessage(message)
	{
		return this._sdk.wallet.signMessage(message);
	}

	async sendTransaction(transaction)
	{
		return this._sdk.multisig.execute(
			this._proxy,
			[ this._sdk.wallet ],
			{
				to:    await transaction.to,
				value: await transaction.value || 0,
				data:  await transaction.data  || "0x",
			}
		);
	}
}
