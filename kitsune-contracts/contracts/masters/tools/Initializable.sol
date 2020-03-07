pragma solidity ^0.6.0;


/**
 * @title Initializable
 * @dev Contains the logic to control the initializing functions.
 * Objective is to enshure generic upgradeability while preventing
 * unauthorized re-initialization.
 */
abstract contract Initializable
{
	/**
	 * @dev Storage slot with the initialization status.
	 * This is the keccak-256 hash of "kitsunewallet.master.initialized".
	 */
	bytes32 internal constant INITIALIZED_SLOT = 0xdd12f8451a8eb0dea8ead465a8ac468e335a28078ef025d3a1d5041ec1a90cda;

	/**
	 * @dev Modifier to check whether the contract is initializing.
	 */
	modifier initializer()
	{
		require(!_isInitialized(), "already-initialized");
		_;
		_lock();
	}

	/**
	 * @dev Returns the current initialization status.
	 * @return locked Current locking status
	 */
	function _isInitialized()
	internal view returns (bool locked)
	{
		bytes32 slot = INITIALIZED_SLOT;
		// solium-disable-next-line security/no-inline-assembly
		assembly
		{
			locked := sload(slot)
		}
	}

	/**
	 * @dev Lock to prevent re-initialization.
	 */
	function _lock()
	internal
	{
		bytes32 slot = INITIALIZED_SLOT;
		// solium-disable-next-line security/no-inline-assembly
		assembly
		{
			sstore(slot, 0x1)
		}
	}

	/**
	 * @dev Unlock to allow initialization.
	 */
	function _unlock()
	internal
	{
		bytes32 slot = INITIALIZED_SLOT;
		// solium-disable-next-line security/no-inline-assembly
		assembly
		{
			sstore(slot, 0x0)
		}
	}
}
