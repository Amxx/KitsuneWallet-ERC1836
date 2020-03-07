pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "../MasterBase.sol";


abstract contract ERC721Receiver is MasterBase, IERC721Receiver
{
	function onERC721Received(
		address,
		address,
		uint256,
		bytes memory)
	public override returns (bytes4)
	{
		return this.onERC721Received.selector;
	}
}
