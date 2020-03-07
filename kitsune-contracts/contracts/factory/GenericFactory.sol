pragma solidity ^0.6.0;

import "./CounterfactualFactory.sol";


contract GenericFactory is CounterfactualFactory
{
	event NewContract(address indexed addr);

	function predictAddress(bytes memory _code, bytes32 _salt)
	public view returns(address)
	{
		return predictAddressWithCall(_code, _salt, bytes(""));
	}

	function createContract(bytes memory _code, bytes32 _salt)
	public returns(address)
	{
		return createContractAndCall(_code, _salt, bytes(""));
	}

	function predictAddressWithCall(bytes memory _code, bytes32 _salt, bytes memory _call)
	public view returns(address)
	{
		return _predictAddress(_code, keccak256(abi.encodePacked(_salt, _call)));
	}

	function createContractAndCall(bytes memory _code, bytes32 _salt, bytes memory _call)
	public returns(address)
	{
		address addr = _create2(_code, keccak256(abi.encodePacked(_salt, _call)));
		emit NewContract(addr);
		if (_call.length > 0)
		{
			// solium-disable-next-line security/no-low-level-calls
			(bool success, bytes memory reason) = addr.call(_call);
			require(success, string(reason));
		}
		return addr;
	}
}
