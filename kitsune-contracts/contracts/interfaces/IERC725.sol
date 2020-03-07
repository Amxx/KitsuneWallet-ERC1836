pragma solidity ^0.6.0;


abstract contract IERC725
{
	event DataChanged(bytes32 indexed key, bytes32 value);
	event ContractCreated(address indexed contractAddress);
	event CallSuccess(address indexed to);
	event CallFailure(address indexed to, bytes returndata);

	function owner()
	public virtual view returns (address);

	function getData(bytes32)
	public virtual view returns (bytes32);

	function setData(bytes32,bytes32)
	public virtual;

	function execute(
		uint256,
		address,
		uint256,
		bytes memory)
	public virtual;
}
