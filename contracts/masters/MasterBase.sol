pragma solidity ^0.5.0;

import "../common/IMaster.sol";
import "../common/Storage.sol";


contract MasterBase is IMaster, Storage
{
	// Need this to handle deposit call forwarded by the proxy
	function () external payable {}

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

	function getData(bytes32 _key)
	external view returns (bytes32)
	{
		return m_store[_key];
	}

	function setData(bytes32 _key, bytes32 _value)
	external protected
	{
		m_store[_key] = _value;
		emit DataChanged(_key, _value);
	}
}
