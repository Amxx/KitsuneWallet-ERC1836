pragma solidity ^0.6.0;


contract Target
{
	address public _lastSender;
	bytes32 public _lastData;

	event Log(address sender, bytes32 data);

	constructor() public {}

	function call(bytes32 data)
	external
	{
		_lastSender = msg.sender;
		_lastData = data;
		emit Log(msg.sender, data);
	}
}
