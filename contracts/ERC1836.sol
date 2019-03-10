pragma solidity ^0.5.0;

contract ERC1836
{
	address                  internal m_delegate;    // Address of the delegate
	uint256                  internal m_nonce;       // Reserved for nonce. Delegate not using it should synchronize during init / cleanup
	mapping(bytes32 => bool) internal m_replay;      // Reserved for replay protection
	bool                     internal m_initialized; // Reserved for initialization protection

	event DelegateChange(address indexed previousDelegate, address indexed newDelegate);

	modifier protected()
	{
		require(msg.sender == address(this), "restricted-access");
		_;
	}

	modifier initialization()
	{
		require(!m_initialized, "already-initialized");
		_;
	}

	function setDelegate(address _newDelegate, bytes memory _initData)
	internal
	{
		emit DelegateChange(m_delegate, _newDelegate);
		m_delegate = _newDelegate;

		if (_initData.length > 0)
		{
			bool success;
			bytes memory returndata;
			m_initialized = false;
			(success, returndata) = _newDelegate.delegatecall(_initData);
			m_initialized = true;
			require(success, "failed-to-initialize-delegate");
		}
	}
}
