pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

/**
 * @title Elliptic curve signature operations
 * @dev Based on https://gist.github.com/axic/5b33912c6f61ae6fd96d6c4a47afde6d
 * TODO Remove this library once solidity supports passing a signature to ecrecover.
 * See https://github.com/ethereum/solidity/issues/864
 */

library ECDSA {
    /**
     * @dev Recover signer address from a message by using their signature
     * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
     * @param signature bytes signature, the signature is generated using web3.eth.sign()
     */
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        // Check the signature length
        if (signature.length != 65) {
            return (address(0));
        }

        // Divide the signature in r, s and v variables
        bytes32 r;
        bytes32 s;
        uint8 v;

        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (281): 0 < s < secp256k1n ÷ 2 + 1, and for v in (282): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            return address(0);
        }

        if (v != 27 && v != 28) {
            return address(0);
        }

        // If the signature is valid (and not malleable), return the signer address
        return ecrecover(hash, v, r, s);
    }

    /**
     * toEthSignedMessageHash
     * @dev prefix a bytes32 value with "\x19Ethereum Signed Message:"
     * and hash the result
     */
    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        // 32 is the length in bytes of hash,
        // enforced by the type signature above
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}

/**
 * @title SafeMath
 * @dev Unsigned math operations with safety checks that revert on error
 */
library SafeMath {
    /**
     * @dev Multiplies two unsigned integers, reverts on overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b);

        return c;
    }

    /**
     * @dev Integer division of two unsigned integers truncating the quotient, reverts on division by zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Subtracts two unsigned integers, reverts on overflow (i.e. if subtrahend is greater than minuend).
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Adds two unsigned integers, reverts on overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a);

        return c;
    }

    /**
     * @dev Divides two unsigned integers and returns the remainder (unsigned integer modulo),
     * reverts when dividing by zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0);
        return a % b;
    }
}

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor () internal {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @return the address of the owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner());
        _;
    }

    /**
     * @return true if `msg.sender` is the owner of the contract.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     * @notice Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0));
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

/**
 * @title ERC20 interface
 * @dev see https://eips.ethereum.org/EIPS/eip-20
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}


interface IERC725
{
	event DataChanged(bytes32 indexed key, bytes value);
	event ContractCreated(address indexed contractAddress);
	event CallSuccess(address indexed to);
	event CallFailure(address indexed to, bytes returndata);
	// event CallFailure(address to, string returndata);

	function owner  ()                                       external view returns (address);
	function getData(bytes32)                                external view returns (bytes memory);
	function setData(bytes32,bytes calldata)                 external;
	function execute(uint256,address,uint256,bytes calldata) external;
}

contract IERC1271
{
	// bytes4(keccak256("isValidSignature(bytes,bytes)")
	bytes4 constant internal MAGICVALUE = 0x20c13b0b;

	/**
	 * @dev Should return whether the signature provided is valid for the provided data
	 * @param _data Arbitrary length data signed on the behalf of address(this)
	 * @param _signature Signature byte array associated with _data
	 *
	 * MUST return the bytes4 magic value 0x20c13b0b when function passes.
	 * MUST NOT modify state (using STATICCALL for solc < 0.5, view modifier for solc > 0.5)
	 * MUST allow external calls
	 */
	// function isValidSignature(
	// 	bytes memory _data,
	// 	bytes memory _signature)
	// 	public
	// 	view
	// 	returns (bytes4 magicValue);

	// Newer version ? From 0x V2
	function isValidSignature(
		bytes32 _data,
		bytes memory _signature
	)
	public
	view
	returns (bool isValid);
}


interface IMaster
{
	function master      ()                            external view returns (address);
	function masterId    ()                            external pure returns (bytes32);
	function updateMaster(address,bytes calldata,bool) external; /*protected*/
	// params may vary -- must be initialization
	// function initialize(...) external initialization;
}


contract Store
{
	// Storage for Upgradability
	address                     internal m_master;
	bool                        internal m_initialized;
	// Generic store
	uint256                     internal m_nonce;
	mapping(bytes32 => bytes32) internal m_persistent;
	mapping(bytes32 => bytes)   internal m_store;
}



contract Core is Store
{
	// Events
	event MasterChange(address indexed previousMaster, address indexed newMaster);

	// Constants
	bytes32 constant MASTER_ID = bytes32(0x1618fcec65bce0693e931d337fc12424ee920bf56c4a74bc8ddb1361328af236); // keccak256("ERC1836_MASTER_ID")

	// Modifiers
	modifier protected()
	{
		require(msg.sender == address(this), "restricted-access");
		_;
	}

	modifier onlyInitializing()
	{
		require(!m_initialized, "already-initialized");
		_;
		m_initialized = true;
	}

	// Internal functions
	function setMaster(address _newMaster, bytes memory _initData)
	internal
	{
		require(IMaster(_newMaster).masterId() == MASTER_ID, "invalid-master-uuid");

		// Update master pointer
		emit MasterChange(m_master, _newMaster);
		m_master = _newMaster;

		// Allows the run of an initialization method in the new master.
		// Will be reset to true by the initialization modifier of the initialize methode.
		m_initialized = false;

		// Call the initialize method in the new master
		(bool success, /*bytes memory returndata*/) = _newMaster.delegatecall(_initData);
		require(success, "failed-to-initialize");
	}
}



contract ERC725Base is IERC725, Core
{
	uint256 constant OPERATION_CALL   = 0;
	uint256 constant OPERATION_CREATE = 1;

	// Need this to handle deposit call forwarded by the proxy
	function () external payable {}

	function getData(bytes32 _key)
	external view returns (bytes memory)
	{
		return m_store[_key];
	}

	function setData(bytes32 _key, bytes calldata _value)
	external protected
	{
		m_store[_key] = _value;
		emit DataChanged(_key, _value);
	}

	function execute(uint256 _operationType, address _to, uint256 _value, bytes memory _data)
	public
	{
		require(msg.sender == this.owner(), 'access-forbidden');
		if (_operationType == OPERATION_CALL)
		{
			bool success;
			bytes memory returndata;
			(success, returndata) = _to.call.value(_value)(_data);
			// Don't revert if call reverted, just log the failure
			// require(success, string(returndata));
			if (success)
			{
				emit CallSuccess(_to);
			}
			else
			{
				emit CallFailure(_to, returndata);
				// emit CallFailure(_to, string(returndata));
			}
		}
		else if (_operationType == OPERATION_CREATE)
		{
			address newContract;
			assembly
			{
				newContract := create(0, add(_data, 0x20), mload(_data))
			}
			emit ContractCreated(newContract);
		}
		else
		{
			revert('invalid-operation-type');
		}
	}
}



contract MasterBase is IMaster, Core
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




contract MasterKeysBase is MasterBase, IERC1271
{
	using ECDSA for bytes32;

	bytes32 constant PURPOSE_MANAGEMENT = 0x0000000000000000000000000000000000000000000000000000000000000001;
	bytes32 constant PURPOSE_ACTION     = 0x0000000000000000000000000000000000000000000000000000000000000002;
	bytes32 constant PURPOSE_SIGN       = 0x0000000000000000000000000000000000000000000000000000000000000004;

	mapping(bytes32 => bytes32) internal m_keyPurposes;
	bytes32[]                   internal m_activeKeys;
	uint256                     internal m_managementKeyCount;
	uint256                     internal m_managementThreshold;
	uint256                     internal m_actionThreshold;

	event SetKey(bytes32 indexed key, bytes32 indexed previousPurpose, bytes32 indexed newPurpose);
	event ManagementThresholdChange(uint256 previousThreshold, uint256 newThreshold);
	event ActionThresholdChange(uint256 previousThreshold, uint256 newThreshold);

	function initialize(
		bytes32[] calldata _keys,
		bytes32[] calldata _purposes,
		uint256            _managementThreshold,
		uint256            _actionThreshold)
	external onlyInitializing
	{
		require(_keys.length == _purposes.length, "key-and-purpose-array-must-have-same-size");
		for (uint256 i = 0; i < _keys.length; ++i)
		{
			_setKey(_keys[i], _purposes[i]);
		}
		require(m_managementKeyCount >= _managementThreshold, "not-enough-management-keys");
		m_managementThreshold = _managementThreshold;
		m_actionThreshold     = _actionThreshold;
	}

	function updateMaster(address _newMaster, bytes calldata _initData, bool _reset)
	external protected
	{
		if (_reset)
		{
			// reset memory space
			for (uint256 i = 0; i < m_activeKeys.length; ++i)
			{
				delete m_keyPurposes[m_activeKeys[i]];
			}
			delete m_activeKeys;
			delete m_managementKeyCount;
			delete m_managementThreshold;
			delete m_actionThreshold;
		}
		// setMaster
		setMaster(_newMaster, _initData);
	}

	// ACCESSORS
	function owner()
	external view returns(address)
	{
		return address(this);
	}

	function nonce()
	public view returns (uint256)
	{
		return m_nonce;
	}

	function managementKeyCount()
	external view returns(uint256)
	{
		return m_managementKeyCount;
	}

	function addrToKey(address _addr)
	public pure returns (bytes32)
	{
		return bytes32(uint256(_addr));
	}

	// KEYS
	function getActiveKeys()                               public view returns (bytes32[] memory) { return m_activeKeys; }
	function getKey       (bytes32 _key)                   public view returns (bytes32) { return m_keyPurposes[          _key ]; }
	function getKey       (address _key)                   public view returns (bytes32) { return m_keyPurposes[addrToKey(_key)]; }
	function keyHasPurpose(bytes32 _key, bytes32 _purpose) public view returns (bool) { return _keyHasPurpose(          _key ,         _purpose ); }
	function keyHasPurpose(bytes32 _key, uint256 _purpose) public view returns (bool) { return _keyHasPurpose(          _key , bytes32(_purpose)); }
	function keyHasPurpose(address _key, bytes32 _purpose) public view returns (bool) { return _keyHasPurpose(addrToKey(_key),         _purpose ); }
	function keyHasPurpose(address _key, uint256 _purpose) public view returns (bool) { return _keyHasPurpose(addrToKey(_key), bytes32(_purpose)); }
	function setKey       (bytes32 _key, bytes32 _purpose) public protected { _setKey(          _key ,         _purpose ); }
	function setKey       (bytes32 _key, uint256 _purpose) public protected { _setKey(          _key , bytes32(_purpose)); }
	function setKey       (address _key, bytes32 _purpose) public protected { _setKey(addrToKey(_key),         _purpose ); }
	function setKey       (address _key, uint256 _purpose) public protected { _setKey(addrToKey(_key), bytes32(_purpose)); }

	function _keyHasPurpose(bytes32 _key, bytes32 _purpose)
	internal view returns (bool)
	{
		return _purpose & ~m_keyPurposes[_key] == bytes32(0);
	}

	function _setKey(bytes32 _key, bytes32 _purpose)
	internal
	{
		// Update management key count
		if (PURPOSE_MANAGEMENT & ~m_keyPurposes[_key] == bytes32(0) && PURPOSE_MANAGEMENT &  _purpose == bytes32(0)) { --m_managementKeyCount; }
		if (PURPOSE_MANAGEMENT &  m_keyPurposes[_key] == bytes32(0) && PURPOSE_MANAGEMENT & ~_purpose == bytes32(0)) { ++m_managementKeyCount; }
		require(m_managementKeyCount >= m_managementThreshold, "cannot-remove-critical-management-key");

		// Update list of active keys (add)
		if (m_keyPurposes[_key] == bytes32(0))
		{
			m_activeKeys.push(_key);
		}

		// emit event
		emit SetKey(_key, m_keyPurposes[_key], _purpose);

		// Set key purpose
		m_keyPurposes[_key] = _purpose;

		// Update list of active keys (rem)
		if (m_keyPurposes[_key] == bytes32(0))
		{
			for (uint256 i = 0; i < m_activeKeys.length; ++i)
			{
				if (m_activeKeys[i] == _key)
				{
					m_activeKeys[i] = m_activeKeys[m_activeKeys.length - 1];
					delete m_activeKeys[m_activeKeys.length - 1];
					m_activeKeys.length--;
					break;
				}
			}
		}
	}

	// MULTISIG
	function getManagementThreshold() external view returns (uint256) { return m_managementThreshold; }
	function getActionThreshold    () external view returns (uint256) { return m_actionThreshold;     }

	function setManagementThreshold(uint256 _managementThreshold)
	external protected
	{
		require(0 != _managementThreshold, "threshold-too-low");
		require(m_managementKeyCount >= _managementThreshold, "threshold-too-high");
		emit ManagementThresholdChange(m_managementThreshold, _managementThreshold);
		m_managementThreshold = _managementThreshold;
	}

	function setActionThreshold(uint256 _actionThreshold)
	external protected
	{
		require(0 != _actionThreshold, "threshold-too-low");
		emit ActionThresholdChange(m_actionThreshold, _actionThreshold);
		m_actionThreshold = _actionThreshold;
	}

	// ERC1271 SIGNING
	function isValidSignature(bytes32 _data, bytes memory _signature)
	public view returns (bool)
	{
		return keyHasPurpose(addrToKey(_data.recover(_signature)), PURPOSE_SIGN);
	}
}




contract WalletOwnable is ERC725Base, MasterBase, IERC1271, Ownable
{
	using ECDSA for bytes32;

	// This is a Master contract, lock it
	constructor()
	public
	{
		renounceOwnership();
	}

	function initialize(address _owner)
	external onlyInitializing
	{
		_transferOwnership(_owner);
	}

	function updateMaster(address _newMaster, bytes calldata _initData, bool _reset)
	external protected
	{
		if (_reset)
		{
			// set owner to 0
			_transferOwnership(address(this));
			renounceOwnership();
		}
		setMaster(_newMaster, _initData);
	}

	function isValidSignature(bytes32 _data, bytes memory _signature)
	public view returns (bool)
	{
		return owner() == _data.recover(_signature);
	}
}



contract WalletMultisig is ERC725Base, MasterKeysBase
{
	// This is a delegate contract, lock it
	constructor()
	public
	{
	}

	function execute
	( uint256        _operationType
	, address        _to
	, uint256        _value
	, bytes   memory _data
	, uint256        _nonce
	, bytes[] memory _sigs
	)
	public
	{
		require(++m_nonce == _nonce, "invalid-nonce");

		bytes32 neededPurpose;
		if (_to == address(this))
		{
			require(_sigs.length >= m_managementThreshold, "missing-signers");
			neededPurpose = PURPOSE_MANAGEMENT;
		}
		else
		{
			require(_sigs.length >= m_actionThreshold, "missing-signers");
			neededPurpose = PURPOSE_ACTION;
		}

		bytes32 executionID = keccak256(abi.encodePacked(
				address(this),
				_operationType,
				_to,
				_value,
				keccak256(_data),
				_nonce
			)).toEthSignedMessageHash();

		address lastSigner = address(0);
		for (uint256 i = 0; i < _sigs.length; ++i)
		{
			address signer  = executionID.recover(_sigs[i]);
			require(signer > lastSigner, "invalid-signatures-ordering");
			require(keyHasPurpose(addrToKey(signer), neededPurpose), "invalid-signature");
			lastSigner = signer;
		}

		this.execute(_operationType, _to, _value, _data);
	}

}




contract WalletMultisigRefund is ERC725Base, MasterKeysBase
{
	using SafeMath for uint256;

	// for refund fine tunning
	uint256 constant BASEGASE = 41300;

	// This is a delegate contract, lock it
	constructor()
	public
	{
	}

	function execute
	( uint256        _operationType
	, address        _to
	, uint256        _value
	, bytes   memory _data
	, uint256        _nonce
	, address        _gasToken
	, uint256        _gasPrice
	, bytes[] memory _sigs
	)
	public
	{
		uint256 gasBefore = gasleft();

		require(++m_nonce == _nonce, "invalid-nonce");

		bytes32 neededPurpose;
		if (_to == address(this))
		{
			require(_sigs.length >= m_managementThreshold, "missing-signers");
			neededPurpose = PURPOSE_MANAGEMENT;
		}
		else
		{
			require(_sigs.length >= m_actionThreshold, "missing-signers");
			neededPurpose = PURPOSE_ACTION;
		}

		bytes32 executionID = keccak256(abi.encodePacked(
				address(this),
				_operationType,
				_to,
				_value,
				keccak256(_data),
				_nonce,
				_gasToken,
				_gasPrice
			)).toEthSignedMessageHash();

		address lastSigner = address(0);
		for (uint256 i = 0; i < _sigs.length; ++i)
		{
			address signer  = executionID.recover(_sigs[i]);
			require(signer > lastSigner, "invalid-signatures-ordering");
			require(keyHasPurpose(addrToKey(signer), neededPurpose), "invalid-signature");
			lastSigner = signer;
		}

		this.execute(_operationType, _to, _value, _data);

		refund(
			BASEGASE
			.add(gasBefore)
			.sub(gasleft())
			.mul(_gasPrice),
			_gasToken
		);
	}

	function refund(uint256 _gasValue, address _gasToken)
	internal
	{
		if (_gasToken == address(0))
		{
			msg.sender.transfer(_gasValue);
		}
		else
		{
			IERC20(_gasToken).transfer(msg.sender, _gasValue);
		}
	}

}




contract WalletMultisigRefundOutOfOrder is ERC725Base, MasterKeysBase
{
	using SafeMath for uint256;

	// for refund fine tunning
	uint256 constant BASEGASE = 43600;

	// This is a delegate contract, lock it
	constructor()
	public
	{
	}

	function execute
	( uint256        _operationType
	, address        _to
	, uint256        _value
	, bytes   memory _data
	, uint256        _nonce
	, bytes32        _salt
	, address        _gasToken
	, uint256        _gasPrice
	, bytes[] memory _sigs
	)
	public
	{
		uint256 gasBefore = gasleft();

		++m_nonce;
		require(_nonce == 0 || _nonce == m_nonce, "invalid-nonce");

		bytes32 neededPurpose;
		if (_to == address(this))
		{
			require(_sigs.length >= m_managementThreshold, "missing-signers");
			neededPurpose = PURPOSE_MANAGEMENT;
		}
		else
		{
			require(_sigs.length >= m_actionThreshold, "missing-signers");
			neededPurpose = PURPOSE_ACTION;
		}

		bytes32 executionID = keccak256(abi.encodePacked(
				address(this),
				_operationType,
				_to,
				_value,
				keccak256(_data),
				_nonce,
				_salt,
				_gasToken,
				_gasPrice
			)).toEthSignedMessageHash();

		require(m_persistent[executionID] == bytes32(0), 'transaction-replay');
		m_persistent[executionID] = bytes32(0xa50daf8ffad995556f094fb7bb26ec5c7aadc7f574c741d0237ea13300bc1dd7);

		address lastSigner = address(0);
		for (uint256 i = 0; i < _sigs.length; ++i)
		{
			address signer  = executionID.recover(_sigs[i]);
			require(signer > lastSigner, "invalid-signatures-ordering");
			require(keyHasPurpose(addrToKey(signer), neededPurpose), "invalid-signature");
			lastSigner = signer;
		}

		this.execute(_operationType, _to, _value, _data);

		refund(
			BASEGASE
			.add(gasBefore)
			.sub(gasleft())
			.mul(_gasPrice),
			_gasToken
		);
	}

	function refund(uint256 _gasValue, address _gasToken)
	internal
	{
		if (_gasToken == address(0))
		{
			msg.sender.transfer(_gasValue);
		}
		else
		{
			IERC20(_gasToken).transfer(msg.sender, _gasValue);
		}
	}

}
