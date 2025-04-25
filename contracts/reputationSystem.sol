// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReputationSystem {
    mapping(address => uint256) public reputation;

    event ReputationUpdated(address indexed worker, uint256 newReputation);

    // Increase reputation
    function increaseReputation(address worker, uint256 amount) public {
        reputation[worker] += amount;
        emit ReputationUpdated(worker, reputation[worker]);
    }

    // Decrease reputation
    function decreaseReputation(address worker, uint256 amount) public {
        require(reputation[worker] >= amount, "Insufficient reputation.");
        reputation[worker] -= amount;
        emit ReputationUpdated(worker, reputation[worker]);
    }

    // Get current reputation of a worker
    function getReputation(address worker) public view returns (uint256) {
        return reputation[worker];
    }
}
