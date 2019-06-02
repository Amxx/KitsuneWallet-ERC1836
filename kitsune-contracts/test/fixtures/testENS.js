const chai       = require('chai');
const ethers     = require('ethers');
const ENSBuilder = require('ens-builder');
const {getWallets, solidity} = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);

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

eth = x => ethers.utils.parseEther(x.toString())
function testENS(sdk)
{
	describe('ENS', async () => {

		const [ wallet, relayer, user1, user2, user3 ] = getWallets(sdk.provider);
		let ensAddress       = undefined;
		let resolverAddress  = undefined;
		let registrarAddress = undefined;
		let providerWithENS  = undefined;

		it('ENS deployment', async () => {
			({ ensAddress, resolverAddress, registrarAddress, providerWithENS } = await withENS(wallet));

			expect(ensAddress).to.not.eq(null);
			expect(resolverAddress).to.not.eq(null);
			expect(registrarAddress).to.not.eq(null);
		});

		it('ENS registration', async () => {
			const domain    = 'kitsune.eth';
			const label     = 'proxy';
			const hashLabel = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label));
			const name      = `${label}.${domain}`;
			const node      = ethers.utils.namehash(name);

			expect(await providerWithENS.resolveName(name)).to.be.eq(null);
			expect(await providerWithENS.lookupAddress(proxy.address)).to.be.eq(null);

			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{
					to: proxy.address,
					data: proxy.interface.functions.registerENS.encode([
						hashLabel,        /* bytes32        */
						name,             /* string         */
						node,             /* bytes32        */
						ensAddress,       /* ENSRegistry    */
						registrarAddress, /* FIFSRegistrar  */
						resolverAddress,  /* PublicResolver */
					]),
				},
				{ options: { gasLimit: 1000000 } }
			)).to.emit(proxy, 'CallSuccess').withArgs(proxy.address);

			expect(await providerWithENS.resolveName(name)).to.be.eq(proxy.address);
			expect(await providerWithENS.lookupAddress(proxy.address)).to.be.eq(name);
		});

	})
}

module.exports = testENS;
