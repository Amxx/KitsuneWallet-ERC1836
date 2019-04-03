pragma solidity ^0.5.0;

contract Target
{
	address public lastSender;
	bytes32 public lastData;

	event Log(address sender, bytes32 data);

	constructor() public {}

	function call(bytes32 data)
	external
	{
		lastSender = msg.sender;
		lastData   = data;
		emit Log(msg.sender, data);
	}
}