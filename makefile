# MINIFICATION
JQN       = ./node_modules/.bin/jqn
PATH_MAIN = ./build/
PATH_MIN  = ./build-minified/
OBJECTS   = $(patsubst $(PATH_MAIN)%.json, %, $(wildcard $(PATH_MAIN)*.json))

# FLATTEN
PATH_FLAT = ./build/
FILE_FLAT = flattened.sol
SRCS   =                                                                      \
	node_modules/openzeppelin-solidity/contracts/cryptography/ECDSA.sol         \
	node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol              \
	node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol          \
	node_modules/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol         \
	contracts/interfaces/IERC725.sol                                            \
	contracts/interfaces/IERC1271.sol                                           \
	contracts/masters/IMaster.sol                                               \
	contracts/common/Store.sol                                                  \
	contracts/common/Core.sol                                                   \
	contracts/masters/ERC725Base.sol                                            \
	contracts/masters/MasterBase.sol                                            \
	contracts/masters/MasterKeysBase.sol                                        \
	contracts/masters/wallets/WalletOwnable.sol                                 \
	contracts/masters/wallets/WalletMultisig.sol                                \
	contracts/masters/wallets/WalletMultisigRefund.sol                          \
	contracts/masters/wallets/WalletMultisigRefundOutOfOrder.sol                \

.PHONY: minify flatten

all:
	@echo "Usage: make [minify|flatten]"

minify: $(OBJECTS)

$(OBJECTS): % : $(PATH_MAIN)%.json makefile
	@mkdir -p $(PATH_MIN)
	@echo -n "Minification of $@.json ..."
	@cat $< | $(JQN) 'pick(["abi","networks"])' --color=false -j > $(PATH_MIN)/$@.json
	@echo " done"

flatten: $(PATH_FLAT)$(FILE_FLAT)

$(PATH_FLAT)$(FILE_FLAT): $(FILES) makefile
	@mkdir -p $(PATH_FLAT)
	@rm -f $@
	@echo "pragma solidity ^0.5.8;" >> $@
	@echo "pragma experimental ABIEncoderV2;" >> $@
	@$(foreach file, $(SRCS),                                    \
		echo -n "Adding $(file) to $@ ...";                        \
		cat $(file) | sed '/^pragma/ d' | sed '/^import/ d' >> $@; \
		echo " done";                                              \
	)
