pragma solidity ^0.4.23;

import "./UsesBorrowerApp.sol";

contract UsesBorrowerAppImpl is UsesBorrowerApp {
    function doSomething() public whenBorrowerAppContractIsSet view returns (bool) {
        return true;
    }
}