pragma solidity ^0.5.0;


contract IERC725
{
	event DataChanged(bytes32 indexed key, bytes32 value);
	event ContractCreated(address indexed contractAddress);
	event CallSuccess(address indexed to);
	event CallFailure(address indexed to, bytes returndata);

	function owner()
		public view returns (address);

	function getData(bytes32)
		public view returns (bytes32);

	function setData(bytes32,bytes32)
		public;

	function execute(
		uint256,
		address,
		uint256,
		bytes memory)
		public;
}
