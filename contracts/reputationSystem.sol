// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReputationSystem {
    mapping(address => uint256) public reputation;
    event ReputationUpdated(address indexed worker, uint256 newReputation);

    function increaseReputation(address worker, uint256 amount) external {
        reputation[worker] += amount;
        emit ReputationUpdated(worker, reputation[worker]);
    }

    function getReputation(address worker) external view returns (uint256) {
        return reputation[worker];
    }
}
