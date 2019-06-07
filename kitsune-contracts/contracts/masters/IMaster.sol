pragma solidity ^0.5.0;


interface IMaster
{
	function implementationId()
		external pure returns (bytes32);

	function updateImplementation(address,bytes calldata,bool)
		external;
}
