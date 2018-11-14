pragma solidity ^0.4.23;

import "../../rayonprotocol-contract-common/contracts/RayonBase.sol";
import "../../rayonprotocol-contract-kyc/contracts/Auth.sol";
import "./BorrowerApp.sol";
import "./contractReference/UsesAuth.sol";
import "./contractReference/UsesBorrowerApp.sol";

contract Borrower is UsesAuth, UsesBorrowerApp, RayonBase{
    struct BorrowerEntry{
        address id;
        uint256 index;
        uint256 updatedTime;
    }

    mapping(address => BorrowerEntry) internal borrowerMap;
    address[] internal borrowerList;

    // constructor
    constructor(uint16 version) RayonBase("Borrower", version) public {}

    // Event defination
    event LogBorrowerAdded(address indexed id);
    event LogBorrowerUpdated(address indexed id);

    function add(address _borrowerId, uint8 _v, bytes32 _r, bytes32 _s) public whenBorrowerAppContractIsSet whenAuthContractIsSet {
        address borrowerAppId = msg.sender;
        BorrowerEntry storage entry = borrowerMap[_borrowerId];
        require(!_contains(entry), "Borrower is already registered");
        
        // borrower app registration check
        require(
            BorrowerApp(borrowerAppContractAddress).contains(borrowerAppId),
            "msg.sender is not registerd borrower app: only registered borrower app can add a borrower"
        );
        // borrower authencation check
        require(
            Auth(authContractAddress).contains(_borrowerId),
            "Borrower is not authenticated: borrower must be authenticated before registered"
        );
        // signature verification
        bytes32 borrowerAppIdHash = keccak256(_addressToBytes(borrowerAppId));
        require(_verifySignature(borrowerAppIdHash, _borrowerId, _v, _r, _s), "Signature can not be verified");

        entry.id = _borrowerId;
        entry.updatedTime = block.timestamp;
        entry.index = borrowerList.push(_borrowerId) - 1;
        emit LogBorrowerAdded(_borrowerId);
    }

    
    function get(address _id) public view returns (address, uint256) {
        BorrowerEntry storage entry = borrowerMap[_id];
        require(_contains(entry), "Borrower is not found");
        // now it only gets id
        return (entry.id, entry.updatedTime);
    }

    function contains(address _id) public view returns (bool) {
        BorrowerEntry storage entry = borrowerMap[_id];
        return _contains(entry);
    }

    function getByIndex(uint256 _index) public view onlyOwner returns (address, uint){
        require(_isInRange(_index), "Borrower index is out of range");

        address id = borrowerList[_index];
        return get(id);
    }

    function getIds() public view onlyOwner returns (address[]){
        return borrowerList;
    }

    function size() public view onlyOwner returns (uint) {
        return borrowerList.length;
    }

    function _contains(BorrowerEntry _entry) private pure returns (bool) {
        return _entry.id != address(0);
    }

    function _isInRange(uint256 _index) private view returns (bool) {
        return (_index >= 0) && (_index < borrowerList.length);
    }
}