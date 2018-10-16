pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../rayonprotocol-contract-common/contracts/RayonBase.sol";

contract UsesAuth is Ownable {
    address internal authContractAddress;
    event LogAuthSet(address authContractAddress);

    modifier whenAuthContractIsSet() {
        require(authContractAddress != 0, "Auth contract is not set");
        _;
    }

    function setAuthContractAddress(address _contractAddress) public onlyOwner {
        require(
            _contractAddress != 0 ||
            keccak256(abi.encodePacked(RayonBase(authContractAddress).getName())) == keccak256(abi.encodePacked("Auth")),
            "Auth contract address is invalid");
        authContractAddress = _contractAddress;
        emit LogAuthSet(authContractAddress);
    }

    function getAuthContractAddress() public view onlyOwner returns (address) {
        return authContractAddress;
    }
}