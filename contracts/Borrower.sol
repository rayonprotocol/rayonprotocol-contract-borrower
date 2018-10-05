pragma solidity ^0.4.23;

import "../../rayonprotocol-contract-common/contracts/RayonBase.sol";
import "../../rayonprotocol-contract-kyc/contracts/Auth.sol";
import "./BorrowerApp.sol";

contract Borrower is RayonBase {
    struct BorrowerEntry{
        address id;
        uint256 index;
        uint256 updatedTime;
    }

    mapping(address => BorrowerEntry) internal borrowerMap;
    address[] internal borrowerList;
    
    
    address internal authContractAddress;
    address internal borrowerAppContractAddress;

    // constructor
    constructor(uint16 version) RayonBase("Borrower", version) public {}

    // Event defination
    event LogBorrowerAdded(address indexed id);
    event LogBorrowerUpdated(address indexed id);


    /**
     * @dev Modifier to make a function callable only when both authContractAddress and borrowerAppContractAddress are set.
     */
    modifier onlyWhenReady() {
        require(
            authContractAddress != address(0) && borrowerAppContractAddress != address(0),
            "Borrower registration is not ready: both authContractAddress and borrowerAppContractAddress must be set"
        );
        _;
    }

    /**
     * @dev Modifier to make a function callable only when `msg.sender` is borrower app.
     */
    modifier onlyBorrowerApp()  {
        // borrower app registration check
        BorrowerApp borrowerAppContract = BorrowerApp(borrowerAppContractAddress);
        require(
            borrowerAppContract.contains(msg.sender),
            "Borrower app for borrower is not registered: borrower only can be registered with registered borrower app"
        );
        _;
    }

    function toBytes(address a) public view returns (bytes b){
        assembly {
            let m := mload(0x40)
            mstore(add(m, 20), xor(0x140000000000000000000000000000000000000000, a))
            mstore(0x40, add(m, 52))
            b := m
        }
    }

    function _verifySignature(address _borrowerAppId, address _signedAddress, uint8 _v, bytes32 _r, bytes32 _s) private view returns (bool) {
        bytes32 borrowerAppIdHash = (keccak256(toBytes(_borrowerAppId)));
        address verifiedAddress = ecrecover(borrowerAppIdHash, _v, _r, _s);
        return verifiedAddress == _signedAddress;
    }

    function add(address _borrowerId, uint8 _v, bytes32 _r, bytes32 _s) public onlyWhenReady onlyBorrowerApp {
        address borrowerAppId = msg.sender;

        BorrowerEntry storage entry = borrowerMap[_borrowerId];
        require(!_contains(entry), "Borrower is already registered");

        // borrower authencation check
        Auth authContract = Auth(authContractAddress);
        require(
            authContract.contains(_borrowerId),
            "Borrower is not authenticated: borrower must be authenticated before registered"
        );

        // signature verification
        require(_verifySignature(borrowerAppId, _borrowerId, _v, _r, _s), "Signature can not be verified");

        entry.id = _borrowerId;
        entry.updatedTime = block.timestamp;
        entry.index = borrowerList.push(_borrowerId) - 1;
        emit LogBorrowerAdded(_borrowerId);
    }

    
    function get(address _id) public view returns (address) {
        BorrowerEntry storage entry = borrowerMap[_id];
        require(_contains(entry), "Borrower is not found");
        // now it only gets id
        return entry.id;
    }

    function getByIndex(uint256 _index) public view onlyOwner returns (address){
        require(_isInRange(_index), "borrower index out of range");

        address id = borrowerList[_index];
        return get(id);
    }

    function getIds() public view onlyOwner returns (address[]){
        return borrowerList;
    }

    function size() public view onlyOwner returns (uint) {
        return borrowerList.length;
    }

    function _contains(BorrowerEntry _entry) private returns (bool) {
        return _entry.id != address(0);
    }

    function _isInRange(uint256 _index) private view returns (bool) {
        return (_index >= 0) && (_index < borrowerList.length);
    }

    function setAuthContractAddress(address _contractAddress) public onlyOwner {
        authContractAddress = _contractAddress;
    }

    function getAuthContractAddress() public view onlyOwner returns (address) {
        return authContractAddress;
    }
    
    function setBorrowerAppContractAddress(address _contractAddress) public onlyOwner {
        borrowerAppContractAddress = _contractAddress;
    }

    function getBorrowerAppContractAddress() public view onlyOwner returns (address) {
        return borrowerAppContractAddress;
    }

}