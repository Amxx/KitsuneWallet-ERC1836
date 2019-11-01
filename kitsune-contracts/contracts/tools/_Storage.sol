pragma solidity ^0.5.9;


/**
 * @title Storage
 * @dev Beneric unstructured key-value store for persistente data.
 */
contract Storage
{
	/**
	 * @dev Slots used as a base for the derivation of keys.
	 * Storage slot is the keccak-256 hash of "kitsunewallet.master.storage".
	 */
	bytes32 internal constant STORAGE_SLOT = 0x39121f76a2883f5e25e3d81f04a9e10d31b31f470a4158c3457e2c13511f55c0;

	/**
	 * @dev Get value in store.
	 * @param key index to retreive
	 * @return bytes32 content stored at key
	 */
	function _get(bytes32 key)
	internal view returns (bytes32 value)
	{
		bytes32 slot = keccak256(abi.encode(STORAGE_SLOT, key));
		// solium-disable-next-line security/no-inline-assembly
		assembly
		{
			value := sload(slot)
		}
	}

	/**
	 * @dev Sets value in store.
	 * @param key index to use
	 * @param value content to store at key
	 */
	function _set(bytes32 key, bytes32 value)
	internal
	{
		bytes32 slot = keccak256(abi.encode(STORAGE_SLOT, key));
		// solium-disable-next-line security/no-inline-assembly
		assembly
		{
			sstore(slot, value)
		}
	}
}
