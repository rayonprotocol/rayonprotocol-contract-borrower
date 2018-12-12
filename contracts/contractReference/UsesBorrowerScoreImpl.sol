pragma solidity ^0.4.23;

import "./UsesBorrowerScore.sol";

contract UsesBorrowerScoreImpl is UsesBorrowerScore {
    function doSomething() public whenBorrowerScoreContractIsSet view returns (bool) {
        return true;
    }
}