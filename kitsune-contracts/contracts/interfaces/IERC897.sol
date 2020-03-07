pragma solidity ^0.6.0;


abstract contract IERC897
{
	function implementation()
	external virtual view returns (address codeAddr);

	function proxyType()
	external virtual pure returns (uint256 proxyTypeId);
}
