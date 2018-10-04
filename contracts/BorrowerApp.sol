pragma solidity ^0.4.23;

import "../../rayonprotocol-contract-common/contracts/RayonBase.sol";

contract BorrowerApp is RayonBase {
    struct BorrowerAppEntry{
        address id;
        string name;
        uint256 index;
        uint256 updatedTime;
    }

    mapping(address => BorrowerAppEntry) internal borrowerAppMap;
    address[] internal borrowerAppList;

    // constructor
    constructor(uint16 version) RayonBase("BorrowerApp", version) public {}

    // Event defination
    event LogBorrowerAppAdded(address indexed id);
    event LogBorrowerAppUpdated(address indexed id);

    function add(address _id, string _name) public onlyOwner {
        BorrowerAppEntry storage entry = borrowerAppMap[_id];
        require(bytes(_name).length > 0, "borrower app name cannot be null");
        require(!_contains(entry), "borrower app already registered");
        entry.id = _id;
        entry.name = _name;
        entry.index = borrowerAppList.push(_id) - 1;
        entry.updatedTime = block.timestamp;

        emit LogBorrowerAppAdded(_id);
    }

    function get(address _id) public view returns (address, string, uint256){
        BorrowerAppEntry storage entry = borrowerAppMap[_id];
        require(_contains(entry), "borrower app not found");

        return (entry.id, entry.name, entry.updatedTime);
    }

    function getByIndex(uint256 _index) public view onlyOwner returns (address, string, uint256){
        require(_isInRange(_index), "borrower app index out of range");

        address id = borrowerAppList[_index];
        return get(id);
    }
    
    function getIds() public view onlyOwner returns (address[]){
        return borrowerAppList;
    }

    function update(address _id, string _name) public onlyOwner {
        BorrowerAppEntry storage entry = borrowerAppMap[_id];
        require(bytes(_name).length > 0, "borrower app name cannot be null");
        require(_contains(entry), "borrower app not found");
        entry.name = _name;
        entry.updatedTime = block.timestamp;
        emit LogBorrowerAppUpdated(_id);
    }

    function contains(address _id) public view returns (bool) {
        BorrowerAppEntry storage entry = borrowerAppMap[_id];
        return _contains(entry);
    }

    function size() public view onlyOwner returns (uint) {
        return borrowerAppList.length;
    }

    function _isInRange(uint256 _index) private view returns (bool) {
        return (_index >= 0) && (_index < borrowerAppList.length);
    }

    function _contains(BorrowerAppEntry memory _entry) private pure returns (bool){
        return _entry.id != address(0);
    }
}