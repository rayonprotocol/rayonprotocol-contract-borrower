pragma solidity ^0.4.21;

import "../../../rayonprotocol-contract-kyc/contracts/Auth.sol";

/**
 * @title AuthMock
 * @dev Mocking contract of AuthMock
 */
contract AuthMock is Auth {
    constructor(uint16 version) Auth(version) {}

    function mockSetContainingId(address _containingId) public {
        AuthEntry storage entry = userAuthMap[_containingId];
        entry.userId = _containingId;
    }

}