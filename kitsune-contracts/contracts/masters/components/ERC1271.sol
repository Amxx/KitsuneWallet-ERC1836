pragma solidity ^0.6.0;

import "../../interfaces/IERC1271.sol";
import "../MasterBase.sol";


abstract contract ERC1271 is MasterBase, IERC1271
{
	bytes4 constant internal MAGICVALUE = 0x20c13b0b;

	function isValidSignature(bytes32 _digest, bytes calldata _signature)
	external override view returns (bytes4)
	{
		require(_isValidSignature(_digest, _signature));
		return MAGICVALUE;
	}

	function _isValidSignature(bytes32 _digest, bytes memory _signature)
	internal virtual view returns (bool);
}
