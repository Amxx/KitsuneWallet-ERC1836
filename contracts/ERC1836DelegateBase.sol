pragma solidity ^0.5.0;

import "./IERC1836Delegate.sol";
import "./ERC1836.sol";

contract ERC1836DelegateBase is IERC1836Delegate, ERC1836
{
	function UUID()
	external pure returns (bytes32)
	{
		// keccak256("ERC1836Delegate")
		return 0xa1e3d116360d73112f374a2ed4cd95388cd39eaf5a7986eb95efa60ae0ffda4d;
	}

	function delegate()
	external view returns (address)
	{
		return m_delegate;
	}

	// Need this to handle deposit call forwarded by the proxy
	function () external payable {}
}
