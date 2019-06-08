pragma solidity ^0.5.0;


interface ITyped
{
	function selector()
		external pure returns (bytes4);
}
