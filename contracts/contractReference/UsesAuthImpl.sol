pragma solidity ^0.4.23;

import "./UsesAuth.sol";

contract UsesAuthImpl is UsesAuth {
    function doSomething() public whenAuthContractIsSet view returns (bool) {
        return true;
    }
}