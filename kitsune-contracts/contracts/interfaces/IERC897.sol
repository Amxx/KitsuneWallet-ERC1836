pragma solidity ^0.6.0;


interface IERC897
{
	function implementation()
	external view returns (address codeAddr);

	function proxyType()
	external pure returns (uint256 proxyTypeId);
}
