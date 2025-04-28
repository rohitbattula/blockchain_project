// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// match the actual filename on disk
import "./reputationSystem.sol";

contract JobBoard {
    struct Job {
        uint256 id;
        address employer;
        string title;
        string description;
        uint256 paymentAmount;
        bool isActive;
    }

    struct Application {
        address applicant;
        string coverLetter;
        bool isAccepted;
    }

    uint256 public jobCount;
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Application[]) public applications;

    ReputationSystem public reputationSystem;

    event JobPosted(uint256 indexed jobId, address indexed employer, string title, uint256 paymentAmount);
    event JobApplied(uint256 indexed jobId, address indexed applicant, string coverLetter);
    event JobAccepted(uint256 indexed jobId, address indexed applicant, uint256 paymentAmount);

    constructor(address _reputationSystem) {
        reputationSystem = ReputationSystem(_reputationSystem);
    }

    function postJob(string memory title, string memory description, uint256 paymentAmount) external {
        jobCount += 1;
        jobs[jobCount] = Job(jobCount, msg.sender, title, description, paymentAmount, true);
        emit JobPosted(jobCount, msg.sender, title, paymentAmount);
    }

    function applyForJob(uint256 jobId, string memory coverLetter) external {
        require(jobs[jobId].isActive, "Job is not active");
        applications[jobId].push(Application(msg.sender, coverLetter, false));
        emit JobApplied(jobId, msg.sender, coverLetter);
    }

    function acceptApplication(uint256 jobId, uint256 applicationIndex) external payable {
        Job storage j = jobs[jobId];
        require(msg.sender == j.employer, "Only employer");
        require(j.isActive, "Already closed");

        Application storage a = applications[jobId][applicationIndex];
        require(!a.isAccepted, "Already accepted");

        a.isAccepted = true;
        j.isActive = false;

        require(msg.value == j.paymentAmount, "Incorrect payment");
        payable(a.applicant).transfer(msg.value);

        reputationSystem.increaseReputation(a.applicant, 1);
        emit JobAccepted(jobId, a.applicant, msg.value);
    }
}
