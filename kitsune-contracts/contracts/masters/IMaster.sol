pragma solidity ^0.5.0;

import "../interfaces/IERC897.sol";
import "../interfaces/ITyped.sol";


contract IMaster is IERC897, ITyped
{
	function implementation()
		external view returns (address);

	function proxyType()
		external pure returns (uint256);

	function selector()
		external pure returns (bytes4);

	function updateImplementation(address, bytes calldata, bool)
		external;

	function controller()
		public view returns (address);
}
