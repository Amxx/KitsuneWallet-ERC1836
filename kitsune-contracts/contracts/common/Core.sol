pragma solidity ^0.5.0;

import "./Store.sol";
import "../masters/IMaster.sol";


contract Core is Store
{
	// Events
	event ImplementationChange(address indexed previousImplementation, address indexed newImplementation);

	// Constants
	bytes32 constant MASTER_ID = bytes32(0x1618fcec65bce0693e931d337fc12424ee920bf56c4a74bc8ddb1361328af236); // keccak256("ERC1836_MASTER_ID")

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
		require(IMaster(newImplementation).implementationId() == MASTER_ID, "invalid-implementation-id");

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
