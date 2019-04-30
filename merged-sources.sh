#!/bin/bash

FILES="
node_modules/openzeppelin-solidity/contracts/cryptography/ECDSA.sol
node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol
node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol
node_modules/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol
contracts/interfaces/IERC725.sol
contracts/interfaces/IERC1271.sol
contracts/masters/IMaster.sol
contracts/common/Store.sol
contracts/common/Core.sol
contracts/masters/ERC725Base.sol
contracts/masters/MasterBase.sol
contracts/masters/MasterKeysBase.sol
contracts/masters/wallets/WalletOwnable.sol
contracts/masters/wallets/WalletMultisig.sol
contracts/masters/wallets/WalletMultisigRefund.sol
contracts/masters/wallets/WalletMultisigRefundOutOfOrder.sol
contracts/masters/wallets/IexecWhitelist.sol
"

echo "pragma solidity ^0.5.7;"
echo "pragma experimental ABIEncoderV2;"

for file in $FILES;
do
	>&2 echo -n "Adding $file ..."
	cat $file | sed '/^pragma/ d' | sed '/^import/ d'
	>&2 echo " done"
done;
