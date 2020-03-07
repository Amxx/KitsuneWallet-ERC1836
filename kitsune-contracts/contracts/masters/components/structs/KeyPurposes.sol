pragma solidity ^0.6.0;

import "../node_modules/solstruct/contracts/libs/LibMap.bytes32.bytes32.sol";



library KeyPurposes
{
	using LibMap_bytes32_bytes32 for LibMap_bytes32_bytes32.map;

	struct keypurposes
	{
		LibMap_bytes32_bytes32.map data;
		uint256                    managers;
	}

	function length(keypurposes storage _keypurposes)
	internal view returns (uint256)
	{
		return _keypurposes.data.length();
	}

	function value(keypurposes storage _keypurposes, bytes32 _key)
	internal view returns (bytes32)
	{
		return _keypurposes.data.value(_key);
	}

	function keyAt(keypurposes storage _keypurposes, uint256 _index)
	internal view returns (bytes32)
	{
		return _keypurposes.data.keyAt(_index);
	}

	function at(keypurposes storage _keypurposes, uint256 _index)
	internal view returns (bytes32, bytes32)
	{
		return _keypurposes.data.at(_index);
	}

	function indexOf(keypurposes storage _keypurposes, bytes32 _key)
	internal view returns (uint256)
	{
		return _keypurposes.data.indexOf(_key);
	}

	function contains(keypurposes storage _keypurposes, bytes32 _key)
	internal view returns (bool)
	{
		return _keypurposes.data.contains(_key);
	}

	function keys(keypurposes storage _keypurposes)
	internal view returns (bytes32[] memory)
	{
		return _keypurposes.data.keys();
	}

	function setKey(keypurposes storage _keypurposes, bytes32 _key, bytes32 _newpurpose)
	internal returns (bool)
	{
		bytes32 oldPurpose = _keypurposes.data.value(_key);

		if (bytes32(uint256(1)) & ~oldPurpose == bytes32(0) && bytes32(uint256(1)) &  _newpurpose == bytes32(0)) { --_keypurposes.managers; }
		if (bytes32(uint256(1)) &  oldPurpose == bytes32(0) && bytes32(uint256(1)) & ~_newpurpose == bytes32(0)) { ++_keypurposes.managers; }

		if (_newpurpose == bytes32(0)) { _keypurposes.data.del(_key);              }
		else                           { _keypurposes.data.set(_key, _newpurpose); }

		return true;
	}

	function clear(keypurposes storage _keypurposes)
	internal returns (bool)
	{
		_keypurposes.data.clear();
		delete _keypurposes.managers;
		return true;
	}
}
