pragma solidity ^0.5.0;

import "./IERC1836Delegate.sol";

contract ERC1836
{
	address                     internal m_delegate;    // Address of the delegate.
	uint256                     internal m_nonce;       // Reserved for nonce. Delegate using a local nonce should synchronize during init / cleanup, and erase their local nonce.
	mapping(bytes32 => bool   ) internal m_replay;      // Reserved for replay protection. Registeres the hash of executed meta-tx that shouldn't be replayed. Persistant across updates.
	mapping(bytes32 => bytes32) internal m_store;       // Generic purpose persistent store (ERC725).
	bool                        internal m_initialized; // Reserved for initialization protection.

	event DelegateChange(address indexed previousDelegate, address indexed newDelegate);

	modifier protected()
	{
		require(msg.sender == address(this), "restricted-access");
		_;
	}

	modifier initialization()
	{
		require(!m_initialized, "already-initialized");
		m_initialized = true;
		_;
	}

	function setDelegate(address _newDelegate, bytes memory _initData)
	internal
	{
		// keccak256("ERC1836Delegate")
		require(IERC1836Delegate(_newDelegate).UUID() == 0xa1e3d116360d73112f374a2ed4cd95388cd39eaf5a7986eb95efa60ae0ffda4d);

		// Update delegate pointer
		emit DelegateChange(m_delegate, _newDelegate);
		m_delegate = _newDelegate;

		// Allows the run of an initialization method in the new delegate.
		// Will be reset to true by the initialization modifier of the initialize methode.
		m_initialized = false;

		// Call the initialize method in the new delegate
		(bool success, /*bytes memory returndata*/) = _newDelegate.delegatecall(_initData);
		require(success, "failed-to-initialize-delegate");
	}
}
