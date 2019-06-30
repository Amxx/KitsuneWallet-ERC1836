pragma solidity ^0.5.0;

import "../proxy/KitsuneProxy.sol";


contract KitsuneProxyFactory
{
	bytes public constant PROXY_CODE = type(KitsuneProxy).creationCode;

	event NewProxy(address indexed proxyAddr);

	function createProxy(address _master, bytes calldata _data, bytes32 _salt)
	external returns(address)
	{
		bytes memory code = abi.encodePacked(PROXY_CODE, abi.encode(_master, bytes("")));
		bytes32      salt = _salt;
		address      addr;

		// solium-disable-next-line security/no-inline-assembly
		assembly
		{
			addr := create2(0, add(code, 0x20), mload(code), salt)
			if iszero(extcodesize(addr)) { revert(0, 0) }
		}

		// solium-disable-next-line security/no-low-level-calls
		(bool success, bytes memory error) = addr.call(_data);
		require(success, string(error));

		emit NewProxy(addr);
		return addr;
	}
}
