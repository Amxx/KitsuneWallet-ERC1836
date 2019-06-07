pragma solidity ^0.5.0;


interface ITyped
{
	function contractType()
		external pure returns (bytes32);
}
