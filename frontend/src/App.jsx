// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import jobBoardABI      from "./abis/JobBoard.json";
import reputationABI    from "./abis/ReputationSystem.json";

// —– Fill in your deployed addresses ↓
const JOBBOARD_ADDRESS   = "0xd3541c4B5D6D5f077FD2B15a07a9BE5800f40094";
const REPUTATION_ADDRESS = "0x4D0EA24b1Da53829E598a1f59f04471F67d61479";

function App() {
  const [account,      setAccount]      = useState(null);
  const [jobBoard,     setJobBoard]     = useState(null);
  const [reputation,   setReputation]   = useState(null);

  // All active jobs
  const [jobs,         setJobs]         = useState([]);
  // Cover letters keyed by jobId
  const [coverLetters, setCoverLetters] = useState({});
  // Applications keyed by jobId → array of { applicant, coverLetter }
  const [applications, setApplications] = useState({});
  // Reputation map: address → number
  const [reps,         setReps]         = useState({});

  // 1️⃣ Connect wallet & instantiate contracts
  useEffect(() => {
    async function init() {
      if (!window.ethereum) {
        console.error("❌ No web3 wallet found");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await provider.getSigner();
      const addr   = await signer.getAddress();
      setAccount(addr);

      // Instantiate
      setJobBoard(new ethers.Contract(JOBBOARD_ADDRESS, jobBoardABI, signer));
      setReputation(new ethers.Contract(REPUTATION_ADDRESS, reputationABI, signer));
    }
    init();
  }, []);

  // 2️⃣ Load all active jobs
  const loadJobs = useCallback(async () => {
    if (!jobBoard) return;
    const count = Number(await jobBoard.jobCount());
    const actives = [];
    for (let i = 1; i <= count; i++) {
      const j = await jobBoard.jobs(i);
      if (j.isActive) {
        // normalize for ease of use
        actives.push({
          id: Number(j.id),
          employer: j.employer,
          title: j.title,
          description: j.description,
          paymentAmount: j.paymentAmount, // BigInt
        });
      }
    }
    setJobs(actives);
  }, [jobBoard]);

  useEffect(() => {
    loadJobs();
  }, [jobBoard, loadJobs]);

  // 3️⃣ Load applications for every job via event logs
  const loadApplications = useCallback(async () => {
    if (!jobBoard || !reputation || jobs.length === 0) return;

    const allApps = {};
    const repSnapshot = { ...reps };

    for (const job of jobs) {
      // filter JobApplied(jobId, applicant, coverLetter)
      const filter = jobBoard.filters.JobApplied(job.id);
      const events = await jobBoard.queryFilter(filter, 0, "latest");

      const arr = events.map(e => ({
        applicant: e.args.applicant,
        coverLetter: e.args.coverLetter,
      }));
      allApps[job.id] = arr;

      // fetch any missing reputations
      for (const { applicant } of arr) {
        const key = applicant.toLowerCase();
        if (repSnapshot[key] == null) {
          const r = Number(await reputation.getReputation(applicant));
          repSnapshot[key] = r;
        }
      }
    }

    setApplications(allApps);
    setReps(repSnapshot);
  }, [jobBoard, reputation, jobs, reps]);

  useEffect(() => {
    loadApplications();
  }, [jobBoard, reputation, jobs, loadApplications]);

  // 4️⃣ Post a new job
  const postJob = async (evt) => {
    evt.preventDefault();
    if (!jobBoard) return;
    const form = evt.target;
    const title = form.title.value;
    const desc  = form.description.value;
    const pay   = form.payment.value;

    const tx = await jobBoard.postJob(
      title,
      desc,
      ethers.parseEther(pay)
    );
    await tx.wait();
    await loadJobs();
    form.reset();
  };

  // 5️⃣ Apply to a job (any non-employer)
  const applyToJob = async (jobId) => {
    if (!jobBoard) return;
    const letter = coverLetters[jobId] || "";
    const tx = await jobBoard.applyForJob(jobId, letter);
    await tx.wait();
    // refresh
    await loadApplications();
  };

  // 6️⃣ Accept an application (employer only)
  const acceptApplication = async (jobId, index) => {
    if (!jobBoard || !reputation) return;
    // Find payment amount
    const job = await jobBoard.jobs(jobId);
    const amount = job.paymentAmount;

    // 1) Transfer payment
    const tx = await jobBoard.acceptApplication(jobId, index, { value: amount });
    await tx.wait();
    // 2) Increase reputation on-chain
    const applicant = applications[jobId][index].applicant;
    const tx2 = await reputation.increaseReputation(applicant, 1);
    await tx2.wait();

    // 3) Refresh both lists
    await loadJobs();
    await loadApplications();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">👩‍💻 Employer Job Board</h1>
      <p className="mb-4">
        Connected as: <span className="font-mono">{account}</span>
      </p>

      {/* Post Job Form */}
      <form onSubmit={postJob} className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Post a New Job</h2>
        <div className="flex space-x-2 mb-2">
          <input name="title" placeholder="Title" className="border rounded px-2 py-1 flex-1" required />
          <input name="description" placeholder="Description" className="border rounded px-2 py-1 flex-1" required />
          <input name="payment" placeholder="ETH" className="border rounded px-2 py-1 w-24" required />
        </div>
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">
          Post Job
        </button>
      </form>

      {/* Open Jobs (Active) */}
      <h2 className="text-2xl font-semibold mb-4">Open Jobs</h2>
      <ul className="space-y-6">
        {jobs.map(job => (
          <li key={job.id} className="border rounded p-4">
            <p><strong>#{job.id}</strong> — {job.title}</p>
            <p className="italic mb-2">{job.description}</p>
            <p className="mb-4">Payment: {ethers.formatEther(job.paymentAmount)} ETH</p>

            {job.employer.toLowerCase() === account?.toLowerCase() ? (
              /* Employer View: show applications under this job */
              <div>
                <h3 className="font-semibold mb-2">Applications</h3>
                {(applications[job.id]?.length || 0) === 0 ? (
                  <p className="text-sm italic">No applications yet.</p>
                ) : (
                  applications[job.id].map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-mono">{app.applicant}</span>
                        <span className="ml-2">(rep: {reps[app.applicant.toLowerCase()]})</span>
                        <div className="italic">“{app.coverLetter}”</div>
                      </div>
                      <button
                        onClick={() => acceptApplication(job.id, idx)}
                        className="bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Accept
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Applicant View: input + apply button */
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Cover letter"
                  value={coverLetters[job.id] || ""}
                  onChange={e =>
                    setCoverLetters({
                      ...coverLetters,
                      [job.id]: e.target.value
                    })
                  }
                  className="border rounded px-2 py-1 flex-1"
                />
                <button
                  onClick={() => applyToJob(job.id)}
                  className="bg-yellow-600 text-black px-3 py-1 rounded"
                >
                  Apply
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
