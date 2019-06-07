pragma solidity ^0.5.0;

import "./Store.sol";
import "./ITyped.sol";


contract Core is Store, ITyped
{
	// Events
	event ImplementationChange(address indexed previousImplementation, address indexed newImplementation);

	// Constants
	bytes32 constant PROXY_ID          = bytes32(0x4c43adc484b2c8f92ea203bb6f9dadab93aa087ceb311e900447f1d79f93b824); // keccak256("ERC1836_PROXY_ID")
	bytes32 constant IMPLEMENTATION_ID = bytes32(0x45dfc21fadc203f5400175cdf9926209cce1c778ede6ea4469f55f63233cac98); // keccak256("ERC1836_IMPLEMENTATION_ID")

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
		require(ITyped(newImplementation).contractType() == IMPLEMENTATION_ID, "invalid-implementation-id");

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
