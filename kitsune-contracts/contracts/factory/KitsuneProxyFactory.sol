pragma solidity ^0.6.0;

import "../proxy/KitsuneProxy.sol";
import "./CounterfactualFactory.sol";


contract KitsuneProxyFactory is CounterfactualFactory
{
	bytes public constant PROXY_CODE = type(KitsuneProxy).creationCode;

	event NewProxy(address indexed proxyAddr);

	function predictAddress(
		address      _master,
		bytes memory _data,
		bytes32      _salt)
	public view returns(address)
	{
		return predictAddressWithCall(_master, _data, bytes(""), _salt);
	}

	function createContract(
		address      _master,
		bytes memory _data,
		bytes32      _salt)
	public returns(address)
	{
		return createContractAndCall(_master, _data, bytes(""), _salt);
	}

	function predictAddressWithCall(
		address      _master,
		bytes memory _data,
		bytes memory _call,
		bytes32      _salt)
	public view returns(address)
	{
		return _predictAddress(abi.encodePacked(PROXY_CODE, abi.encode(_master, _data)), keccak256(abi.encodePacked(_salt, _call)));
	}

	function createContractAndCall(
		address      _master,
		bytes memory _data,
		bytes memory _call,
		bytes32      _salt)
	public returns(address)
	{
		address addr = _create2(abi.encodePacked(PROXY_CODE, abi.encode(_master, _data)), keccak256(abi.encodePacked(_salt, _call)));
		emit NewProxy(addr);
		if (_call.length > 0)
		{
			// solium-disable-next-line security/no-low-level-calls
			(bool success, bytes memory reason) = addr.call(_call);
			require(success, string(reason));
		}
		return addr;
	}
}
