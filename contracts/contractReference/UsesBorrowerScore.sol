pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../rayonprotocol-contract-common/contracts/RayonBase.sol";

contract UsesBorrowerScore is Ownable {
    address internal borrowerScoreContractAddress;
    event LogBorrowerScoreSet(address borrowerScoreContractAddress);

    modifier whenBorrowerScoreContractIsSet() {
        require(borrowerScoreContractAddress != 0, "BorrowerScore contract is not set");
        _;
    }

    function setBorrowerScoreContractAddress(address _contractAddress) public onlyOwner {
        require(
            _contractAddress != 0 ||
            keccak256(abi.encodePacked(RayonBase(borrowerScoreContractAddress).getName())) == keccak256(abi.encodePacked("BorrowerScore")),
            "BorrowerScore contract address is invalid");
        borrowerScoreContractAddress = _contractAddress;
        emit LogBorrowerScoreSet(borrowerScoreContractAddress);
    }

    function getBorrowerScoreContractAddress() public view onlyOwner returns (address) {
        return borrowerScoreContractAddress;
    }
}