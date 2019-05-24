pragma solidity ^0.5.0;


contract Store
{
	// Storage for Upgradability
	address                     internal _master;
	bool                        internal _initialized;
	// Generic store
	uint256                     internal _nonce;
	mapping(bytes32 => bytes32) internal _persistent;
	mapping(bytes32 => bytes)   internal _store;
}
