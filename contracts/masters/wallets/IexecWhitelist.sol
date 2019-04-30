pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./WalletMultisig.sol";


contract IexecWhitelist is WalletMultisig
{
	// This is a delegate contract, lock it
	constructor()
	public
	{
	}

	function addrToKey(address addr)
	public pure returns (bytes32)
	{
		return keccak256(abi.encode(addr));
	}
}
