// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
        uint256 jobId;
        string coverLetter;
        bool isAccepted;
    }

    uint256 public jobCount = 0;
    uint256 public applicationCount = 0;

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Application[]) public applications;

    event JobPosted(uint256 indexed jobId, address indexed employer, string title, uint256 paymentAmount);
    event JobApplied(uint256 indexed jobId, address indexed applicant, string coverLetter);
    event JobAccepted(uint256 indexed jobId, address indexed employer, address indexed applicant, uint256 paymentAmount);

    // Employer can post a new job
    function postJob(string memory title, string memory description, uint256 paymentAmount) public {
        jobCount++;
        jobs[jobCount] = Job(jobCount, msg.sender, title, description, paymentAmount, true);
        emit JobPosted(jobCount, msg.sender, title, paymentAmount);
    }

    // Applicant can apply for a job
    function applyForJob(uint256 jobId, string memory coverLetter) public {
        require(jobs[jobId].isActive, "Job is not active.");
        applicationCount++;
        applications[jobId].push(Application(msg.sender, jobId, coverLetter, false));
        emit JobApplied(jobId, msg.sender, coverLetter);
    }

    // Employer can accept an application and transfer payment
    function acceptApplication(uint256 jobId, uint256 applicationIndex) public payable {
        require(msg.sender == jobs[jobId].employer, "Only employer can accept applications.");
        Application storage application = applications[jobId][applicationIndex];
        require(!application.isAccepted, "Application already accepted.");

        application.isAccepted = true;
        payable(application.applicant).transfer(jobs[jobId].paymentAmount);
        emit JobAccepted(jobId, msg.sender, application.applicant, jobs[jobId].paymentAmount);
    }

    // Employer can deactivate a job listing
    function deactivateJob(uint256 jobId) public {
        require(msg.sender == jobs[jobId].employer, "Only employer can deactivate the job.");
        jobs[jobId].isActive = false;
    }
}
