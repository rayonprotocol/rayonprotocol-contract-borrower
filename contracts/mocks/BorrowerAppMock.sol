pragma solidity ^0.4.21;

import "../BorrowerApp.sol";

/**
 * @title BorrowerAppMock
 * @dev Mocking contract of BorrowerAppMock
 */
contract BorrowerAppMock is BorrowerApp {
    constructor(uint16 version) BorrowerApp(version) {}

    function mockSetContainingId(address _containingId) public {
        BorrowerAppEntry storage entry = borrowerAppMap[_containingId];
        entry.id = _containingId;
    }

}