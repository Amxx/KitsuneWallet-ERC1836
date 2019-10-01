pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./ERC712Lib.sol";


contract ERC712Base
{
	string public ERC712_name;
	string public ERC712_version;

	constructor(
		string memory _name,
		string memory _version)
	public
	{
		ERC712_name    = _name;
		ERC712_version = _version;
	}

	function chainID()
	public pure returns(uint256)
	{
		return 1;
	}

	function domain()
	public view returns(ERC712SignatureVerification.EIP712Domain memory)
	{
		return ERC712SignatureVerification.EIP712Domain({
			name:              "KitsuneWalletMultisigV2"
		, version:           "0.0.1"
		, chainId:           chainID()
		, verifyingContract: address(this)
		});
	}
}
