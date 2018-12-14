pragma solidity ^0.4.23;

import "../../rayonprotocol-contract-common/contracts/RayonBase.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract BorrowerScore is RayonBase {
    using SafeMath for uint256;

    mapping(bytes32 => uint256) internal scoreMap;

    // constructor
    constructor(uint16 version) RayonBase("BorrowerScore", version) public {}

    // Event defination
    event LogBorrowerScoreAdded(address indexed borrowerAppId, address indexed borrowerId, uint256 indexed period, uint256 score);

    /**
     * @dev accumulate borrower scores by period (30 days)
     */
    function add(address _borrowerAppId, address _borrowerId, uint256 _score) public onlyOwner {
        uint256 period = block.timestamp.div(30 days);
        bytes32 key = keccak256(abi.encodePacked(period, _borrowerAppId, _borrowerId));
        scoreMap[key] = scoreMap[key].add(_score);
        LogBorrowerScoreAdded(_borrowerAppId, _borrowerId, period, _score);
    }

    function get(address _borrowerAppId, address _borrowerId, uint256 _timestamp) public view returns (uint256) {
        uint256 period = _timestamp.div(30 days);
        bytes32 key = keccak256(abi.encodePacked(period, _borrowerAppId, _borrowerId));
        return scoreMap[key];
    }
}