pragma solidity ^0.5.5;

contract ERC1xxx
{
	address private m_delegate;
	bool    private m_initialized;

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

	constructor(address _delegate, bytes memory _initData)
	public
	{
		setDelegate(_delegate, _initData);
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
			require(success, "failled-to-initialize-delegate");
		}
	}

	function ()
	external payable
	{
		if (m_delegate != address(0) && msg.sig != bytes4(0))
		{
			assembly
			{
				let to  := and(sload(0x0), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) // m_delegate
				let ptr := mload(0x40)
				calldatacopy(ptr, 0, calldatasize)
				let result := delegatecall(gas, to, ptr, calldatasize, 0, 0)
				let size := returndatasize
				returndatacopy(ptr, 0, size)
				switch result
				case 0  { revert (ptr, size) }
				default { return (ptr, size) }
			}
		}
	}
}
