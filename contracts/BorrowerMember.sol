pragma solidity ^0.4.23;

import "../../rayonprotocol-contract-common/contracts/RayonBase.sol";

contract BorrowerMember is RayonBase {
    struct BorrowerMemberEntry {
        address borrwerAppId;
        address borrwerId;
        uint256 entryKeyIndex;
        uint256 borrowerAppToBorrowerIndex;
        uint256 borrowerToBorrowerAppIndex;
        uint256 joinedTime;
    }

    mapping(bytes32 => BorrowerMemberEntry) public entryMap;
    mapping(address => mapping (address => bytes32)) public borrowerAppToBorrowerMap;

    bytes32[] public entryKeyList;

    mapping(address => bytes32[]) borrowerAppToBorrowerListMap;
    mapping(address => bytes32[]) borrowerToBorrowerAppListMap;

    event LogBorrowerMemberJoined(address indexed borrowerAppId, address indexed borrowerId);
    event LogBorrowerMemberUnjoined(address indexed borrowerAppId, address indexed borrowerId);

    function join(address _borrowerAppId, address _borrowerId) public {
        require(!isJoined(_borrowerAppId, _borrowerId), "Join of borrowerApp and borrower already exists");

        bytes32 key = keccak256(abi.encodePacked(_borrowerAppId, _borrowerId));

        BorrowerMemberEntry storage entry = entryMap[key];
        entry.borrwerAppId = _borrowerAppId;
        entry.borrwerId = _borrowerId;
        entry.entryKeyIndex = entryKeyList.push(key) - 1;
        entry.borrowerAppToBorrowerIndex = borrowerAppToBorrowerListMap[_borrowerAppId].push(key) - 1;
        entry.borrowerToBorrowerAppIndex = borrowerToBorrowerAppListMap[_borrowerId].push(key) - 1;
        entry.joinedTime = block.timestamp;
        borrowerAppToBorrowerMap[_borrowerAppId][_borrowerId] = key;
        emit LogBorrowerMemberJoined(_borrowerAppId, _borrowerId);
    }

    function unjoin(address _borrowerAppId, address _borrowerId) public {
        require(isJoined(_borrowerAppId, _borrowerId), "Join of borrowerApp and borrower is not found");

        bytes32 key = borrowerAppToBorrowerMap[_borrowerAppId][_borrowerId];

        BorrowerMemberEntry storage entry = entryMap[key]; // entryMap

        // entryKeyList
        bytes32 lastKeyOfList = entryKeyList[entryKeyList.length - 1];
        entryMap[lastKeyOfList].entryKeyIndex = entry.entryKeyIndex;
        entryKeyList[entry.entryKeyIndex] = lastKeyOfList;
        entryKeyList.length--;

        // borrowerAppToBorrowerListMap
        lastKeyOfList = borrowerAppToBorrowerListMap[_borrowerAppId][borrowerAppToBorrowerListMap[_borrowerAppId].length - 1];
        entryMap[lastKeyOfList].borrowerAppToBorrowerIndex = entry.borrowerAppToBorrowerIndex;
        borrowerAppToBorrowerListMap[_borrowerAppId][entry.borrowerAppToBorrowerIndex] = lastKeyOfList;
        borrowerAppToBorrowerListMap[_borrowerAppId].length--;

        // borrowerAppToBorrowerListMap
        lastKeyOfList = borrowerAppToBorrowerListMap[_borrowerId][borrowerAppToBorrowerListMap[_borrowerId].length - 1];
        entryMap[lastKeyOfList].courceToBorrowerAppIndex = entry.courceToBorrowerAppIndex;
        borrowerAppToBorrowerListMap[_borrowerId][entry.courceToBorrowerAppIndex] = lastKeyOfList;
        borrowerAppToBorrowerListMap[_borrowerId].length--;

        // delete from borrowerAppToBorrowerMap
        delete borrowerAppToBorrowerMap[_borrowerAppId][_borrowerId];

        // delete from entryMap
        delete entryMap[key];

        require(!isJoined(_borrowerAppId, _borrowerId));
        emit LogBorrowerMemberUnjoined(_borrowerAppId, _borrowerId);
    }

    function getJoinedTotalCount() public view returns (uint) {
        return entryKeyList.length;
    }

    function getBorrowerMember(address _borrowerAppId, address _borrowerId) public returns (uint256) {
        require(!isJoined(_borrowerAppId, _borrowerId), "Join of borrowerApp and borrower already exists");
        bytes32 key = borrowerAppToBorrowerMap[_borrowerAppId][_borrowerId];

        BorrowerMemberEntry storage entry = entryMap[key];
        // it only returns joined time
        return entry.joinedTime;
    }

    function getJoinedBorrowerCount(address _borrowerAppId) public view onlyOwner returns (uint) {
        return borrowerAppToBorrowerListMap[_borrowerAppId].length;
    }

    function getJoinedBorrowerId(address _borrowerAppId, uint index) public view onlyOwner returns (bytes32) {
        bytes32 key = borrowerAppToBorrowerListMap[_borrowerAppId][index];
        require(_exists(key), "Join is not found at index");

        BorrowerMemberEntry storage entry = entryMap[key];
        return entry.borrwerId;
    }

    function getJoinedBorrowerAppCount(bytes32 _borrowerId) public view onlyOwner returns (uint) {
        return borrowerToBorrowerAppListMap[_borrowerId].length;
    }

    function getJoinedBorrowerAppId(bytes32 _borrowerId, uint index) public view onlyOwner returns (address) {
        bytes32 key = borrowerToBorrowerAppListMap[_borrowerId][index];
        require(_exists(key), "Join is not found at index");

        BorrowerMemberEntry storage entry = entryMap[key];
        return entry.borrowerAppId;
    }

    function isJoined(address _borrowerAppId, address _borrowerId) public view returns (bool) {
        return _exists(borrowerAppToBorrowerMap[_borrowerAppId][_borrowerId]);
    }

    function _exists(bytes32 key) private returns (bool) {
        return key != 0;
    }

}