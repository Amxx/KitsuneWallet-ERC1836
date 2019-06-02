// const chai       = require('chai');
const ethers     = require('ethers');
const ENSBuilder = require('ens-builder');
// const {getWallets, solidity} = require('ethereum-waffle');

async function withENS(wallet, domain = 'kitsune.eth')
{
	const ensBuilder       = new ENSBuilder(wallet);
	const [label, tld]     = domain.split('.');
	const ensAddress       = await ensBuilder.bootstrapWith(label, tld);
	const resolverAddress  = ensBuilder.resolver.address;
	const registrarAddress = ensBuilder.registrars[domain].address;
	const providerWithENS = new ethers.providers.Web3Provider(wallet.provider._web3Provider, { ...wallet.provider._network, ensAddress });
	return { ensAddress, resolverAddress, registrarAddress, providerWithENS };
}

module.exports = withENS;
