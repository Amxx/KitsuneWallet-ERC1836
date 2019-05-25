pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/IERC721Receiver.sol";


contract ERC721Receiver is IERC721Receiver
{
	function onERC721Received(address,address,uint256,bytes memory)
	public returns (bytes4)
	{
		return this.onERC721Received.selector;
	}
}
