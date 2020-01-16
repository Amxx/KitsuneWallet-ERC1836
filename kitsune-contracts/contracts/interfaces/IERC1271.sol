pragma solidity ^0.5.0;


interface IERC1271
{
	function isValidSignature(bytes32,bytes calldata)
	external view returns (bytes4);
}
