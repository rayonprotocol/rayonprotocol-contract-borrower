pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../rayonprotocol-contract-common/contracts/RayonBase.sol";

contract UsesBorrower is Ownable {
    address internal borrowerContractAddress;
    event LogBorrowerSet(address borrowerContractAddress);

    modifier whenBorrowerContractIsSet() {
        require(borrowerContractAddress != 0, "Borrower contract is not set");
        _;
    }

    function setBorrowerContractAddress(address _contractAddress) public onlyOwner {
        require(
            _contractAddress != 0 ||
            keccak256(abi.encodePacked(RayonBase(borrowerContractAddress).getName())) == keccak256(abi.encodePacked("Borrower")),
            "Borrower contract address is invalid");
        borrowerContractAddress = _contractAddress;
        emit LogBorrowerSet(borrowerContractAddress);
    }

    function getBorrowerContractAddress() public view onlyOwner returns (address) {
        return borrowerContractAddress;
    }
}