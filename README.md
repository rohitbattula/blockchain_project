# Blockchain Job Board DApp

A full-stack Ethereum DApp that lets employers post jobs, applicants apply with cover letters, and employers accept one applicant per job—automatically transferring payment and bumping on‐chain reputation points.

This project uses Hardhat for smart-contract development and Vite + React + Tailwind CSS for the frontend.

---

## Repository Structure

```
blockchain_project/
├── contracts/
│   ├── JobBoard.sol          # Employer ↔ Applicant flow
│   ├── DAOHiring.sol         # (Optional) DAO-governed hiring
│   ├── ReputationSystem.sol  # On-chain reputation points
│   └── Lock.sol              # (example/unused)
├── scripts/
│   └── deploy.js             # Hardhat deploy script
├── test/                     # Smart contract tests (Mocha/Chai)
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx           # React application
│   │   └── abis/             # Auto-generated ABI JSON files
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.cjs
├── .env                      # Secrets (MNEMONIC, INFURA key)
├── hardhat.config.js
├── package.json
└── README.md
```

---

## Features

- **Post jobs** on-chain with title, description, and ETH payment.
- **Apply** with a cover letter to any open job.
- **Employer view**: see only your jobs and their applications.
- **Accept one applicant** per job:
  - Transfers the full payment in a single tx.
  - Marks the job inactive (removing it from “Open Jobs”).
  - Increases the hired applicant’s on-chain reputation (+1).
- **View reputation** of any address.

---

## Prerequisites

- **Node.js** v18+ and npm  
- **MetaMask** or any Web3-enabled browser wallet  
- **Infura** (or Alchemy) project ID for Sepolia RPC  
- A Sepolia account funded with test ETH  

---

## Setup

1. **Clone** this repository  
   ```bash
   git clone https://github.com/rohitbattula/blockchain_project.git
   cd blockchain_project
   ```

2. **Install** root dependencies  
   ```bash
   npm install
   ```

3. **Create** a `.env` in the project root:  
   ```env
   MNEMONIC="private key"
   ```

---

## Smart Contracts

### Compile  
```bash
npx hardhat compile
```


### Deploy to Sepolia  
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Note the deployed addresses for `ReputationSystem` and `JobBoard`.

---

## Frontend

1. **Install** dependencies  
   ```bash
   cd frontend
   npm install
   ```

2. **Configure** contract addresses in `src/App.jsx`:  
   ```js
   const JOBBOARD_ADDRESS   = "0xYourJobBoardAddress";
   const REPUTATION_ADDRESS = "0xYourReputationAddress";
   ```

3. **Run** the dev server  
   ```bash
   npm run dev
   ```
   Visit <http://localhost:5173>.

---

## Usage

1. Connect your wallet (Sepolia).  
2. Post a job: fill title, description, ETH.  
3. In another account, apply with a cover letter.  
4. As the employer, view applications under your job and click **Accept**:
   - ETH transfers to the applicant.  
   - On-chain reputation increments.  
   - Job disappears from the list.  

---

## Further Improvements

- DAO‑governed hiring with `DAOHiring.sol`.  
- Reputation‑gated applications/voting.  
- IPFS for off‑chain data.  
- UI polish with a component library.  

---


