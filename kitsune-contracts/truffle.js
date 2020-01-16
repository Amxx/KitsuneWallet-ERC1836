var HDWalletProvider = require("truffle-hdwallet-provider");

module.exports =
{
	plugins: [ "truffle-security" ],
	networks:
	{
		development:
		{
			host:       "localhost",
			port:       8545,
			network_id: "*",
			gasPrice:   10000000000, //10Gwei
		},
		mainnet:
		{
			provider: () => new HDWalletProvider(process.env.DEPLOYER_MNEMONIC, process.env.MAINNET_NODE),
			network_id: '1',
			gasPrice:   10000000000, //10Gwei
		}
	},
	compilers: {
		solc: {
			version: "0.5.16",
			settings: {
				optimizer: {
					enabled: true,
					runs: 200
				}
			}
		}
	},
	mocha:
	{
		enableTimeouts: false
	}
};
