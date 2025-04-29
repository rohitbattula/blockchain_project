// src/App.jsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import jobBoardAbi      from "./abis/JobBoard.json";
import reputationAbi    from "./abis/ReputationSystem.json";

// ▶️ Replace with your deployed addresses
const JOBBOARD_ADDRESS   = "0x5E0d29ca75556deED74d7b5F538A0711BD2A204b";
const REPUTATION_ADDRESS = "0xFf2A997D3e805DDbcd863273718A7FdF27837d0f";

export default function App() {
  const [account,    setAccount]    = useState(null);
  const [jobBoard,   setJobBoard]   = useState(null);
  const [reputation, setReputation] = useState(null);

  const [jobs,         setJobs]         = useState([]);   // Active jobs
  const [appsByJob,    setAppsByJob]    = useState({});   // { jobId: [ { applicant, coverLetter, isAccepted } ] }
  const [coverLetters, setCoverLetters] = useState({});   // { jobId: letter }
  const [reps,         setReps]         = useState({});   // { address: reputation }

  // 1️⃣ Connect wallet & instantiate contracts
  useEffect(() => {
    async function init() {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());

      setJobBoard(new ethers.Contract(JOBBOARD_ADDRESS, jobBoardAbi, signer));
      setReputation(new ethers.Contract(REPUTATION_ADDRESS, reputationAbi, signer));
    }
    init();
  }, []);

  // 2️⃣ Load all active jobs
  useEffect(() => {
    if (!jobBoard) return;
    (async () => {
      const count = Number(await jobBoard.jobCount());
      const active = [];
      for (let i = 1; i <= count; i++) {
        const j = await jobBoard.jobs(i);
        if (j.isActive) {
          active.push({
            id: i,
            employer: j.employer,
            title: j.title,
            description: j.description,
            payment: j.paymentAmount
          });
        }
      }
      setJobs(active);
    })();
  }, [jobBoard]);

  // 3️⃣ Load applications + reputations for each job
  useEffect(() => {
    if (!jobBoard || !reputation || jobs.length === 0) return;
    (async () => {
      const newApps = {};
      const repCache = { ...reps };

      for (const job of jobs) {
        // use the view helper getApplicationsForJob
        const [addrs, letters, accepted] = await jobBoard.getApplicationsForJob(job.id);

        newApps[job.id] = addrs.map((addr, idx) => ({
          applicant: addr,
          coverLetter: letters[idx],
          isAccepted: accepted[idx]
        }));

        // preload reputation for each applicant
        for (const addr of addrs) {
          const key = addr.toLowerCase();
          if (repCache[key] == null) {
            repCache[key] = Number(await reputation.getReputation(addr));
          }
        }
      }

      setAppsByJob(newApps);
      setReps(repCache);
    })();
  }, [jobBoard, reputation, jobs]);

  // 4️⃣ Post a new job
  const postJob = async e => {
    e.preventDefault();
    const { title, description, payment } = e.target.elements;
    const tx = await jobBoard.postJob(
      title.value,
      description.value,
      ethers.parseEther(payment.value)
    );
    await tx.wait();
    e.target.reset();
    // refresh jobs
    const count = Number(await jobBoard.jobCount());
    const j = await jobBoard.jobs(count);
    setJobs(prev => [
      ...prev,
      {
        id: count,
        employer: j.employer,
        title: j.title,
        description: j.description,
        payment: j.paymentAmount
      }
    ]);
  };

  // 5️⃣ Apply to a job (fixed)
  const applyToJob = async jobId => {
    const letter = coverLetters[jobId] || "";
    const tx = await jobBoard.applyForJob(jobId, letter);
    await tx.wait();

    // reload that job's applications
    const [addrs, letters, accepted] = await jobBoard.getApplicationsForJob(jobId);
    setAppsByJob(prev => ({
      ...prev,
      [jobId]: addrs.map((addr, idx) => ({
        applicant: addr,
        coverLetter: letters[idx],
        isAccepted: accepted[idx]
      }))
    }));

    // reload that applicant's reputation
    const newApplicant = addrs[addrs.length - 1];
    const newRep = Number(await reputation.getReputation(newApplicant));
    setReps(prev => ({
      ...prev,
      [newApplicant.toLowerCase()]: newRep
    }));
  };

  // 6️⃣ Accept one application
  const acceptApplication = async (jobId, idx) => {
    // pay + accept + rep bump happens in one tx on-chain
    const job = jobs.find(j => j.id === jobId);
    const tx = await jobBoard.acceptApplication(jobId, idx, { value: job.payment });
    await tx.wait();

    // drop this job from active list
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">📋 Job Board DApp</h1>
      <p className="mb-6">Connected: <code>{account}</code></p>

      {/* Post Job */}
      <form onSubmit={postJob} className="mb-8">
        <h2 className="text-2xl mb-2">Post a Job</h2>
        <div className="flex space-x-2 mb-2">
          <input name="title" placeholder="Title" className="border px-2 flex-1" required />
          <input name="description" placeholder="Description" className="border px-2 flex-1" required />
          <input name="payment" placeholder="ETH" className="border px-2 w-24" required />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2">Submit Job</button>
      </form>

      {/* Open Jobs */}
      <h2 className="text-2xl mb-4">Open Jobs</h2>
      <ul className="space-y-6">
        {jobs.map(job => (
          <li key={job.id} className="border p-4 rounded">
            <p>
              <strong>#{job.id}</strong> — {job.title}
            </p>
            <p className="italic mb-2">{job.description}</p>
            <p className="mb-4">Payment: {ethers.formatEther(job.payment)} ETH</p>

            {job.employer.toLowerCase() === account?.toLowerCase() ? (
              <>
                <h3 className="font-semibold mb-2">Applications</h3>
                {(appsByJob[job.id] || []).length === 0 ? (
                  <p className="italic">No applications yet.</p>
                ) : (
                  appsByJob[job.id].map((app, i) => (
                    <div key={i} className="flex justify-between items-center mb-2">
                      <div>
                        <code>{app.applicant}</code> (rep: {reps[app.applicant.toLowerCase()]})
                        <div className="italic">“{app.coverLetter}”</div>
                      </div>
                      <button
                        onClick={() => acceptApplication(job.id, i)}
                        className="bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Accept
                      </button>
                    </div>
                  ))
                )}
              </>
            ) : (
              <div className="flex space-x-2">
                <input
                  placeholder="Cover letter"
                  value={coverLetters[job.id] || ""}
                  onChange={e =>
                    setCoverLetters({
                      ...coverLetters,
                      [job.id]: e.target.value
                    })
                  }
                  className="border px-2 flex-1"
                />
                <button
                  onClick={() => applyToJob(job.id)}
                  className="bg-yellow-500 text-black px-3 rounded"
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
