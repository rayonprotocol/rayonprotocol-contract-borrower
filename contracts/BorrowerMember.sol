pragma solidity ^0.4.23;

import "../../rayonprotocol-contract-common/contracts/RayonBase.sol";
import "./BorrowerApp.sol";
import "./Borrower.sol";
import "./contractReference/UsesBorrowerApp.sol";
import "./contractReference/UsesBorrower.sol";
contract BorrowerMember is UsesBorrowerApp, UsesBorrower, RayonBase {
    struct BorrowerMemberEntry {
        address borrowerAppId;
        address borrowerId;
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

    // constructor
    constructor(uint16 version) RayonBase("BorrowerMember", version) public {}

    function join(address _borrowerId, uint8 _v, bytes32 _r, bytes32 _s) public whenBorrowerAppContractIsSet whenBorrowerContractIsSet {
        address borrowerAppId = msg.sender;
        require(!isJoined(borrowerAppId, _borrowerId), "Join of borrowerApp and borrower already exists");
        // referential integrity validation
        require(
            BorrowerApp(borrowerAppContractAddress).contains(borrowerAppId),
            "msg.sender is not registerd borrower app: only registered borrower app can join itself with a borrower"
        );
        require(Borrower(borrowerContractAddress).contains(_borrowerId), "Borrower is not found");
        // signature verification
        bytes32 borrowerAppIdHash = keccak256(_addressToBytes(borrowerAppId));
        require(_verifySignature(borrowerAppIdHash, _borrowerId, _v, _r, _s), "Signature can not be verified");

        bytes32 key = keccak256(abi.encodePacked(borrowerAppId, _borrowerId));

        BorrowerMemberEntry storage entry = entryMap[key];
        entry.borrowerAppId = borrowerAppId;
        entry.borrowerId = _borrowerId;
        entry.entryKeyIndex = entryKeyList.push(key) - 1;
        entry.borrowerAppToBorrowerIndex = borrowerAppToBorrowerListMap[borrowerAppId].push(key) - 1;
        entry.borrowerToBorrowerAppIndex = borrowerToBorrowerAppListMap[_borrowerId].push(key) - 1;
        entry.joinedTime = block.timestamp;
        borrowerAppToBorrowerMap[borrowerAppId][_borrowerId] = key;
        emit LogBorrowerMemberJoined(borrowerAppId, _borrowerId);
    }

    function getJoinedTotalCount() public view onlyOwner returns (uint) {
        return entryKeyList.length;
    }

    function getBorrowerMemberByIndex(uint _index) public view onlyOwner returns (address, address, uint256) {
        bytes32 key = entryKeyList[_index];
        require(_exists(key), "Join is not found at index");

        BorrowerMemberEntry storage entry = entryMap[key];
        return (entry.borrowerId, entry.borrowerAppId, entry.joinedTime);
    }

    function getBorrowerMember(address _borrowerAppId, address _borrowerId) public view returns (uint256) {
        require(isJoined(_borrowerAppId, _borrowerId), "Join of borrowerApp and borrower is not found");
        bytes32 key = borrowerAppToBorrowerMap[_borrowerAppId][_borrowerId];

        BorrowerMemberEntry storage entry = entryMap[key];
        // it only returns joined time
        return entry.joinedTime;
    }

    function getJoinedBorrowerCount(address _borrowerAppId) public view returns (uint) {
        return borrowerAppToBorrowerListMap[_borrowerAppId].length;
    }

    function getJoinedBorrowerId(address _borrowerAppId, uint _index) public view returns (address) {
        bytes32 key = borrowerAppToBorrowerListMap[_borrowerAppId][_index];
        require(_exists(key), "Join is not found at index");

        BorrowerMemberEntry storage entry = entryMap[key];
        return entry.borrowerId;
    }

    function getJoinedBorrowerAppCount(address _borrowerId) public view returns (uint) {
        return borrowerToBorrowerAppListMap[_borrowerId].length;
    }

    function getJoinedBorrowerAppId(address _borrowerId, uint _index) public view returns (address) {
        bytes32 key = borrowerToBorrowerAppListMap[_borrowerId][_index];
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