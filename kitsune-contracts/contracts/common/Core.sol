pragma solidity ^0.5.0;

import "./Store.sol";
import "../masters/IMaster.sol";


contract Core is Store
{
	// Events
	event MasterChange(address indexed previousMaster, address indexed newMaster);

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
	function setMaster(address newMaster, bytes memory initData)
	internal
	{
		require(IMaster(newMaster).masterId() == MASTER_ID, "invalid-master-uuid");

		// Update master pointer
		emit MasterChange(_master, newMaster);
		_master = newMaster;

		// Allows the run of an initialization method in the new master.
		// Will be reset to true by the initialization modifier of the initialize methode.
		_initialized = false;

		// Call the initialize method in the new master
		// solium-disable-next-line security/no-low-level-calls
		(bool success, /*bytes memory returndata*/) = newMaster.delegatecall(initData);
		require(success, "failed-to-initialize");
	}
}
