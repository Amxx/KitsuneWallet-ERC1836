pragma solidity ^0.5.0;

import "../MasterBase.sol";


contract FrontrunningProtection is MasterBase
{
	uint256 internal _prefixLength;
	bytes32 internal _prefixHash;

	// This is a Master contract, lock it
	constructor()
	public
	{
	}

	function initialize(uint256 prefixLength, bytes32 prefixHash)
	external initializer()
	{
		_prefixLength = prefixLength;
		_prefixHash   = prefixHash;
	}

	function cleanup()
	internal
	{
		delete _prefixLength;
		delete _prefixHash;
	}

	function secureSetup(address logic, bytes memory data)
	public returns (bool)
	{
		bytes32 partialhash;
		uint256 length = _prefixLength;

		assembly
		{
			// Back up select memory
			let temp1 := mload(add(data, 0x00))
			// Place loogic (header)
			mstore(add(data, 0x00), logic)
			// Compute hash
			partialhash := keccak256(add(data, 0x00), length)
			// Restore memory
			mstore(add(data, 0x00), temp1)
		}
		require(partialhash == _prefixHash, "invalid-parameters");

		this.updateImplementation(logic, data, false);
		return true;
	}

	// ACCESSORS
	function _isController(address _controller)
	internal view returns (bool)
	{
		return _controller == address(this);
	}
}
