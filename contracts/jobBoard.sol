// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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

    ReputationSystem public reputationSystem;
    uint256 public jobCount;
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Application[]) public applications;

    constructor(address _reputationSystem) {
        reputationSystem = ReputationSystem(_reputationSystem);
    }

    function postJob(string memory title, string memory description, uint256 paymentAmount) external {
        jobCount += 1;
        jobs[jobCount] = Job(jobCount, msg.sender, title, description, paymentAmount, true);
    }

    function applyForJob(uint256 jobId, string memory coverLetter) external {
        require(jobs[jobId].isActive, "Job not active");
        applications[jobId].push(Application(msg.sender, coverLetter, false));
    }

    function acceptApplication(uint256 jobId, uint256 idx) external payable {
        Job storage j = jobs[jobId];
        require(msg.sender == j.employer, "Only employer");
        require(j.isActive, "Already closed");

        Application storage a = applications[jobId][idx];
        require(!a.isAccepted, "Already accepted");

        // mark accepted + close
        a.isAccepted = true;
        j.isActive = false;

        // pay out
        require(msg.value == j.paymentAmount, "Wrong value");
        payable(a.applicant).transfer(msg.value);

        // bump reputation
        reputationSystem.increaseReputation(a.applicant, 1);
    }

    /// 📦 NEW helper: return arrays of all applications for a job
    function getApplicationsForJob(uint256 jobId)
        external
        view
        returns (
            address[] memory addrs,
            string[] memory letters,
            bool[] memory accepted
        )
    {
        Application[] storage apps = applications[jobId];
        uint256 n = apps.length;
        addrs    = new address[](n);
        letters  = new string[](n);
        accepted = new bool[](n);
        for (uint i = 0; i < n; i++) {
            addrs[i]    = apps[i].applicant;
            letters[i]  = apps[i].coverLetter;
            accepted[i] = apps[i].isAccepted;
        }
    }
}
