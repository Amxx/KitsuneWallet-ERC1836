pragma solidity ^0.5.0;

import "../proxy/KitsuneProxy.sol";
import "./CounterfactualFactory.sol";


contract KitsuneProxyFactory is CounterfactualFactory
{
	bytes public constant PROXY_CODE = type(KitsuneProxy).creationCode;

	event NewProxy(address indexed proxyAddr);

	function predictAddress(
		address      _master,
		bytes memory _data,
		bytes32      _seed
	)
	public view returns(address)
	{
		return _predictAddress(
			abi.encodePacked(PROXY_CODE, abi.encode(_master, _data)),
			keccak256(abi.encodePacked(_seed, _data))
		);
	}

	function createProxy(
		address      _master,
		bytes memory _data,
		bytes32      _seed
	)
	public returns(address)
	{
		address addr = _create2(
			abi.encodePacked(PROXY_CODE, abi.encode(_master, _data)),
			keccak256(abi.encodePacked(_seed, _data))
		);

		emit NewProxy(addr);
		return addr;
	}

	function createProxyAndCallback(
		address _master,
		bytes memory _data,
		bytes memory _callback,
		bytes32      _seed
	)
	public returns(address)
	{
		address addr = createProxy(_master, _data, _seed);
		// solium-disable-next-line security/no-low-level-calls
		(bool success, bytes memory reason) = addr.call(_callback);
		require(success, string(reason));
		return addr;
	}

}
