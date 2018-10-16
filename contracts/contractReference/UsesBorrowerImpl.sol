pragma solidity ^0.4.23;

import "./UsesBorrower.sol";

contract UsesBorrowerImpl is UsesBorrower {
    function doSomething() public whenBorrowerContractIsSet view returns (bool) {
        return true;
    }
}