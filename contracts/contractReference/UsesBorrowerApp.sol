pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../rayonprotocol-contract-common/contracts/RayonBase.sol";

contract UsesBorrowerApp is Ownable {
    address internal borrowerAppContractAddress;
    event LogBorrowerAppSet(address borrowerAppContractAddress);

    modifier whenBorrowerAppContractIsSet() {
        require(borrowerAppContractAddress != 0,"BorrowerApp contract is not set");
        _;
    }

    function setBorrowerAppContractAddress(address _contractAddress) public onlyOwner {
        require(
            _contractAddress != 0 ||
            keccak256(abi.encodePacked(RayonBase(borrowerAppContractAddress).getName())) == keccak256(abi.encodePacked("BorrowerApp")),
            "BorrowerApp contract address is invalid");
        borrowerAppContractAddress = _contractAddress;
        emit LogBorrowerAppSet(borrowerAppContractAddress);
    }

    function getBorrowerAppContractAddress() public view onlyOwner returns (address) {
        return borrowerAppContractAddress;
    }
}