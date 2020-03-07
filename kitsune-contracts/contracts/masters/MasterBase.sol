pragma solidity ^0.6.0;

import "./IMaster.sol";
import "../zos-upgradeability/BaseUpgradeabilityProxy.sol";
import "./tools/Context.sol";
import "./tools/Initializable.sol";
import "./tools/Restricted.sol";
import "./tools/Storage.sol";


/**
 * @title MasterBase
 * @dev This contract the base kitsune's masters.
 */
abstract contract MasterBase is
	IMaster,
	BaseUpgradeabilityProxy,
	Context,
	Initializable,
	Restricted,
	Storage
{
	/**
	 * @dev Empty fallback function (can be overriden again).
	 */
	receive()  external virtual override payable {}
	fallback() external virtual override payable {}
}
