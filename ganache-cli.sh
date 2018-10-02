#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    kill -9 $ganache_pid
  fi
}

if [ "$SOLIDITY_COVERAGE" = true ]; then
  ganache_port=8555
else
  ganache_port=8545
fi

ganache_running() {
  nc -z localhost "$ganache_port"
}

start_ganache() {
  # We define 5 accounts with balance 1M ether from `$TEST_MNEMONIC` m/44'/60'/0'/0/0~5, needed for high-value and signature tests.
  local accounts=(
    --account="0x26aa1c7601761ce0399cd593644ec1e53c67b24e88e5e3f152730a6128e859a5,1000000000000000000000000"
    --account="0x4ddea77332d595b63334639d52cb4c9700c0049a2b4fc09729118e7b2991f559,1000000000000000000000000"
    --account="0x95b7edc6cd9051639bf6c0f6717cd835356ed6fffeaee6a4b4facaf9d70b20fc,1000000000000000000000000"
    --account="0xfcf5c38596986ea4d54fc737e8fc9e42cc0b78a16d1aab8f4de9d08d52c3ad40,1000000000000000000000000"
    --account="0xb43422181730e59a7423de6c8f81d1e1a29125e6500a5e29b0c7a1336f3d0d9f,1000000000000000000000000"
  )

  if [ "$SOLIDITY_COVERAGE" = true ]; then
    if [ -e node_modules/.bin/testrpc-sc ]; then
      echo "npm installed"
      # If you installed using npm
      node_modules/.bin/testrpc-sc --gasLimit 0xfffffffffff --port "$ganache_port" "${accounts[@]}" > /dev/null &
    else
      # If you installed using yarn
      echo "yarn installed"
      node_modules/ethereumjs-testrpc-sc/build/cli.node.js  --gasLimit 0xfffffffffff --port "$ganache_port" "${accounts[@]}" > /dev/null &
    fi
  else
    node_modules/.bin/ganache-cli --gasLimit 0xfffffffffff "${accounts[@]}" > /dev/null &
  fi
  ganache_pid=$!
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  echo "Starting our own ganache instance"
  start_ganache
fi

if [ "$SOLC_NIGHTLY" = true ]; then
  echo "Downloading solc nightly"
  wget -q https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/bin/soljson-nightly.js -O /tmp/soljson.js && find . -name soljson.js -exec cp /tmp/soljson.js {} \;
fi

if [ "$SOLIDITY_COVERAGE" = true ]; then
  node_modules/.bin/solidity-coverage

  if [ "$CONTINUOUS_INTEGRATION" = true ]; then
    cat coverage/lcov.info | node_modules/.bin/coveralls
  fi
else
  node_modules/.bin/truffle test --reset --network rpc "$@"
fi