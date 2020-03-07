pragma solidity ^0.6.0;

import "../components/MasterCore.sol";
import "../components/Ownable.sol";
import "../components/ENSIntegration.sol";
import "../components/ERC721Receiver.sol";


contract WalletOwnable is MasterCore, Ownable, ENSIntegration, ERC721Receiver
{
	// This is a delegate contract, lock it
	constructor()
	public
	{
	}
}
