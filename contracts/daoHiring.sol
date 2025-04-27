// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DAOHiring {
    struct Job {
        uint256 id;
        address employer;
        string title;
        string description;
        uint256 paymentAmount;
        bool isActive;
        address[] applicants;
        mapping(address => bool) voted;
    }

    uint256 public jobCount = 0;
    mapping(uint256 => Job) public jobs;

    event JobPosted(uint256 indexed jobId, address indexed employer, string title);
    event VoteCast(uint256 indexed jobId, address indexed voter, address indexed applicant);
    event HiringDecisionMade(uint256 indexed jobId, address indexed employer, address indexed applicant);

    // Employer can post a job
    function postJob(string memory title, string memory description, uint256 paymentAmount) public {
        jobCount++;
        
        Job storage newJob = jobs[jobCount];
        newJob.id = jobCount;
        newJob.employer = msg.sender;
        newJob.title = title;
        newJob.description = description;
        newJob.paymentAmount = paymentAmount;
        newJob.isActive = true;
        
        emit JobPosted(jobCount, msg.sender, title);
    }

    // DAO members vote on applicants
    function voteForApplicant(uint256 jobId, address applicant) public {
        require(jobs[jobId].isActive, "Job is not active.");
        require(!jobs[jobId].voted[msg.sender], "You have already voted.");
        
        jobs[jobId].voted[msg.sender] = true;
        jobs[jobId].applicants.push(applicant);
        emit VoteCast(jobId, msg.sender, applicant);
    }

    // Employer can make the final hiring decision
    function makeHiringDecision(uint256 jobId, address applicant) public {
        require(msg.sender == jobs[jobId].employer, "Only employer can make the decision.");
        
        uint256 votes = 0;
        for (uint i = 0; i < jobs[jobId].applicants.length; i++) {
            if (jobs[jobId].applicants[i] == applicant) {
                votes++;
            }
        }

        require(votes > jobs[jobId].applicants.length / 2, "Applicant did not receive majority votes.");
        jobs[jobId].isActive = false;
        payable(applicant).transfer(jobs[jobId].paymentAmount);
        emit HiringDecisionMade(jobId, msg.sender, applicant);
    }

    // Employer can deactivate a job listing
    function deactivateJob(uint256 jobId) public {
        require(msg.sender == jobs[jobId].employer, "Only employer can deactivate the job.");
        jobs[jobId].isActive = false;
    }
}
