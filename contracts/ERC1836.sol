pragma solidity ^0.5.5;

contract ERC1836
{
	address internal m_delegate;
	bool    internal m_initialized;

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

	function delegate()
	external view returns (address)
	{
		return m_delegate;
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
