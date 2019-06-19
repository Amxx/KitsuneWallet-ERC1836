pragma solidity ^0.5.0;

import "../interfaces/IERC897.sol";
import "../interfaces/ITyped.sol";


contract IMaster is IERC897, ITyped
{
	function controller()
		public view returns (address);

	function updateImplementation(address, bytes calldata, bool)
		external;
}
