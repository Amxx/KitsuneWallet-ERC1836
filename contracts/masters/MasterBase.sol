pragma solidity ^0.5.0;

import "./IMaster.sol";
import "./ERC725Base.sol";


contract MasterBase is IMaster, ERC725Base // ERC725Base is Core
{
	function master()
	external view returns (address)
	{
		return m_master;
	}

	function masterId()
	external pure returns (bytes32)
	{
		return MASTER_ID;
	}
}
