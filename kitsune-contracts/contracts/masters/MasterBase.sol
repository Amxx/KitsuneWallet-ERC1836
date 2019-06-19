pragma solidity ^0.5.0;

import "../common/Core.sol";
import "./IMaster.sol";


contract MasterBase is IMaster, Core
{
	modifier onlyController()
	{
		require(msg.sender == controller(), "access-denied");
		_;
	}

	function implementation()
	external view returns (address)
	{
		return _implementation;
	}

	function proxyType()
	external pure returns (uint256)
	{
		return 2;
	}

	function selector()
	external pure returns (bytes4)
	{
		return MASTER_SELECTOR;
	}

	function updateImplementation(address newImplementation, bytes calldata initializationData, bool reset)
	external onlyController()
	{
		if (reset) { cleanup(); }
		setImplementation(newImplementation, initializationData);
	}

	function cleanup()
	internal
	{
		revert("not-implemented");
	}
}
