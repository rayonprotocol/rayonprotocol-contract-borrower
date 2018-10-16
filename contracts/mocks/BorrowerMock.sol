pragma solidity ^0.4.21;

import "../Borrower.sol";

/**
 * @title BorrowerMock
 * @dev Mocking contract of BorrowerMock
 */
contract BorrowerMock is Borrower {
    constructor(uint16 version) Borrower(version) {}

    function mockSetContainingId(address _containingId) public {
        BorrowerEntry storage entry = borrowerMap[_containingId];
        entry.id = _containingId;
    }

}