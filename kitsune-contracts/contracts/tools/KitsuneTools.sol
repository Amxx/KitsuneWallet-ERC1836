pragma solidity ^0.5.0;

import "./_Initializable.sol";
import "./_Restricted.sol";
import "./_Storage.sol";


/**
 * @title Initializable
 * @dev Contains the logic to control the initializing functions.
 * Objective is to enshure generic upgradeability while preventing
 * unauthorized re-initialization.
 */
contract KitsuneTools is
	Initializable,
	Restricted,
	Storage
{
}
