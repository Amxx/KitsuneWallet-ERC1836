pragma solidity ^0.5.0;

import "./Store.sol";
import "../interfaces/IERC897.sol";
import "../interfaces/ITyped.sol";


contract Core is Store
{
	// Events
	event ImplementationChange(address indexed previousImplementation, address indexed newImplementation);

	// Constants
	bytes4 constant PROXY_SELECTOR  = bytes4(0x55f8d406); // bytes4(keccak256("ERC1836_PROXY_SELECTOR"))
	bytes4 constant MASTER_SELECTOR = bytes4(0x5541c30d); // bytes4(keccak256("ERC1836_MASTER_SELECTOR"))

	// Modifiers
	modifier onlyInitializing()
	{
		require(!_initialized, "already-initialized");
		_;
		_initialized = true;
	}

	// Internal functions
	function setImplementation(address newImplementation, bytes memory initializationData)
	internal
	{
		require(ITyped(newImplementation).selector() == MASTER_SELECTOR, "invalid-master-selector");
		require(IERC897(newImplementation).implementation() == address(0), "invalid-master-implementation");

		// Update _implementation pointer
		emit ImplementationChange(_implementation, newImplementation);
		_implementation = newImplementation;

		// Allows the run of an initialization method in the new implementation.
		// Will be reset to true by the initialization modifier of the initialize methode.
		_initialized = false;

		// Call the initialize method in the new implementation
		// solium-disable-next-line security/no-low-level-calls
		(bool success, /*bytes memory returndata*/) = newImplementation.delegatecall(initializationData);
		require(success, "failed-to-initialize");
	}
}
