pragma solidity ^0.5.0;


contract Store
{
	// Storage for Upgradability
	address                     internal m_master;
	bool                        internal m_initialized;
	// Generic store
	uint256                     internal m_nonce;
	mapping(bytes32 => bytes32) internal m_persistent;
	mapping(bytes32 => bytes)   internal m_store;
}
