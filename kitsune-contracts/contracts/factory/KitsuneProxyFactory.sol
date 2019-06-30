pragma solidity ^0.5.0;

import "../proxy/KitsuneProxy.sol";


contract KitsuneProxyFactory
{
	bytes public constant PROXY_CODE = type(KitsuneProxy).creationCode;

	event NewProxy(address indexed proxyAddr);

	function createProxy(address master, bytes calldata data, bytes32 salt)
	external returns(address)
	{
		address proxy = _create2(
			abi.encodePacked(
				PROXY_CODE,
				abi.encode(master, bytes(""))
			),
			salt
		);

		// solium-disable-next-line security/no-low-level-calls
		(bool success, bytes memory error) = proxy.call(data);
		require(success, string(error));

		emit NewProxy(proxy);
		return proxy;
	}

	function _create2(bytes memory _code, bytes32 _salt)
	internal returns(address)
	{
		bytes memory code = _code;
		bytes32      salt = _salt;
		address      addr;
		// solium-disable-next-line security/no-inline-assembly
		assembly
		{
			addr := create2(0, add(code, 0x20), mload(code), salt)
			if iszero(extcodesize(addr)) { revert(0, 0) }
		}
		return addr;
	}
}
