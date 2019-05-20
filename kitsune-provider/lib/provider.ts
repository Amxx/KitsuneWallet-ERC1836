import { ethers } from 'ethers';
const { SDK } = require('@kitsune-wallet/sdk/dist/sdk');

export class ProxySigner extends ethers.Signer
{
	provider;
	_sdk;
	_proxy;

	constructor(
		provider: ethers.providers.Provider,
		wallet:   ethers.Wallet,
		proxyName,
		proxyAddress,
	)
	{
		super();
		this.provider = provider;
		this._sdk     = new SDK(provider, wallet);
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
