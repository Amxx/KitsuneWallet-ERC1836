pragma solidity ^0.5.0;

import "../../interfaces/IERC1271.sol";


contract ERC1271 is IERC1271
{
	bytes4 constant internal MAGICVALUE = 0x20c13b0b;

	function isValidSignature(bytes32 _digest, bytes calldata _signature)
	external view returns (bytes4)
	{
		require(_isValidSignature(_digest, _signature));
		return MAGICVALUE;
	}

	function _isValidSignature(bytes32 _digest, bytes memory _signature)
	internal view returns (bool);
}
