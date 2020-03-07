pragma solidity ^0.6.0;


abstract contract IERC1271
{
	// bytes4(keccak256("isValidSignature(bytes,bytes)")
	bytes4 constant internal MAGICVALUE = 0x20c13b0b;

	function isValidSignature(
		bytes32 _data,
		bytes memory _signature
	)
	public virtual view returns (bytes4);
}
