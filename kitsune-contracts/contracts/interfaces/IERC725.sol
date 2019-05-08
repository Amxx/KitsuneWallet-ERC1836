pragma solidity ^0.5.0;


interface IERC725
{
	event DataChanged(bytes32 indexed key, bytes value);
	event ContractCreated(address indexed contractAddress);
	event CallSuccess(address indexed to);
	event CallFailure(address indexed to, bytes returndata);
	// event CallFailure(address to, string returndata);

	function owner  ()                                       external view returns (address);
	function getData(bytes32)                                external view returns (bytes memory);
	function setData(bytes32,bytes calldata)                 external;
	function execute(uint256,address,uint256,bytes calldata) external;
}
