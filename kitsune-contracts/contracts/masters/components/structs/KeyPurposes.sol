pragma solidity ^0.6.0;

import "../node_modules/solstruct/contracts/libs/LibMap.bytes32.bytes32.sol";



library KeyPurposes
{
	struct keypurposes
	{
		LibMap_bytes32_bytes32.map data;
		uint256                    managers;
	}

	function length  (keypurposes storage _keypurposes                ) internal view returns (uint256         ) { return LibMap_bytes32_bytes32.length  (_keypurposes.data        ); }
	function value   (keypurposes storage _keypurposes, bytes32 _key  ) internal view returns (bytes32         ) { return LibMap_bytes32_bytes32.value   (_keypurposes.data, _key  ); }
	function keyAt   (keypurposes storage _keypurposes, uint256 _index) internal view returns (bytes32         ) { return LibMap_bytes32_bytes32.keyAt   (_keypurposes.data, _index); }
	function at      (keypurposes storage _keypurposes, uint256 _index) internal view returns (bytes32, bytes32) { return LibMap_bytes32_bytes32.at      (_keypurposes.data, _index); }
	function indexOf (keypurposes storage _keypurposes, bytes32 _key  ) internal view returns (uint256         ) { return LibMap_bytes32_bytes32.indexOf (_keypurposes.data, _key  ); }
	function contains(keypurposes storage _keypurposes, bytes32 _key  ) internal view returns (bool            ) { return LibMap_bytes32_bytes32.contains(_keypurposes.data, _key  ); }
	function keys    (keypurposes storage _keypurposes                ) internal view returns (bytes32[] memory) { return LibMap_bytes32_bytes32.keys    (_keypurposes.data        ); }

	function setKey(keypurposes storage _keypurposes, bytes32 _key, bytes32 _newpurpose)
	internal returns (bool)
	{
		bytes32 oldPurpose = LibMap_bytes32_bytes32.value(_keypurposes.data, _key);

		if (bytes32(uint256(1)) & ~oldPurpose == bytes32(0) && bytes32(uint256(1)) &  _newpurpose == bytes32(0)) { --_keypurposes.managers; }
		if (bytes32(uint256(1)) &  oldPurpose == bytes32(0) && bytes32(uint256(1)) & ~_newpurpose == bytes32(0)) { ++_keypurposes.managers; }

		if (_newpurpose == bytes32(0)) { LibMap_bytes32_bytes32.del(_keypurposes.data, _key);              }
		else                           { LibMap_bytes32_bytes32.set(_keypurposes.data, _key, _newpurpose); }

		return true;
	}

	function clear(keypurposes storage _keypurposes)
	internal returns (bool)
	{
		LibMap_bytes32_bytes32.clear(_keypurposes.data);
		_keypurposes.managers = 0;
		return true;
	}
}
