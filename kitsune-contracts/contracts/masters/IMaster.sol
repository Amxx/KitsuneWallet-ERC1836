pragma solidity ^0.5.0;


interface IMaster
{
	function master      ()                            external view returns (address);
	function masterId    ()                            external pure returns (bytes32);
	function updateMaster(address,bytes calldata,bool) external;
}
