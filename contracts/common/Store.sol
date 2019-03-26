pragma solidity ^0.5.0;


contract Store
{
	// Storage for Master
	address                   internal m_master;
	bool                      internal m_initialized;
	uint256                   internal m_nonce;
	mapping(bytes32 => bool ) internal m_replay;

	// Storage for ERC725
	mapping(bytes32 => bytes) internal m_store;
}
