# NodAI - REAL MVP Launch Plan

**One spec. One stack. One outcome.**

---

## The Tech Stack (Final, No Changes)


| Layer                | Technology                | Why                                   |
| -------------------- | ------------------------- | ------------------------------------- |
| **Frontend**         | SvelteKit                 | Fast, modern, agents know it          |
| **Styling**          | Tailwind CSS              | Quick UI, agents know it              |
| **Backend/Database** | Supabase                  | Auth, PostgreSQL, RLS, realtime       |
| **File Storage**     | AWS S3                    | Model files, presigned URLs           |
| **Inference**        | vLLM                      | OpenAI-compatible, actually works     |
| **Blockchain**       | Solana (Devnet → Mainnet) | NOD token, wallet connect             |
| **RPC**              | Helius or QuickNode       | Production-ready, not public endpoint |
| **Hosting**          | Vercel                    | SvelteKit deployment                  |
| **Node App**         | Rust + Tauri + Svelte     | GPU node software                     |


**That's it. No more. No less.**

---



## The REAL MVP Scope (Tiny, Working, Monday)

**One model. One inference path. One reward mechanism. One wallet.**

### What the MVP Does

1. **User signs up** (email + password via Supabase)
2. **User connects Solana wallet** (Phantom/Backpack)
3. **User views one model** (pre loaded or uploaded)
4. **User runs inference** against that model (real vLLM)
5. **User earns NOD** for running inference (real devnet tx)
6. **User sees dashboard** (balance, usage, history)
7. **GPU node runs** on a single server (your server)



### What the MVP Does NOT Do

- Multiple GPU nodes
- Complex pricing
- Creator earnings
- Anti-gaming systems
- License tracking
- Data rights
- Open-source contribution tracking

**Those come after Monday.**

---



## Phase 1: Saturday (Today) - Foundation



### Task 1.1: Supabase Setup

- Create project
- Run migrations for:
  - `profiles` (id, email, username, wallet_address, created_at)
  - `models` (id, name, description, license, model_path, created_at)
  - `inference_jobs` (id, user_id, model_id, prompt, response, tokens_used, status, created_at)
  - `transactions` (id, user_id, type, amount, signature, status, created_at)
- Set up Row Level Security
- Create service role key



### Task 1.2: SvelteKit Project

- Initialize with TypeScript
- Set up Tailwind
- Configure environment variables (.env)
- Set up Supabase client
- Set up wallet adapter (Solana)



### Task 1.3: Landing Page

- Hero: "The Open AI Network. Share Models. Run AI. Earn NOD."
- One CTA: "Get Started"
- Links: Models, Dashboard, GitHub, Discord
- NO crypto jargon. NO token speculation. Just product.



### Task 1.4: Authentication

- Sign up page (email + password)
- Sign in page
- Protected routes
- Session management



### Task 1.5: Wallet Connection

- Connect Phantom/Backpack
- Store wallet address in profiles table
- Show wallet address on dashboard
- Show SOL balance (read-only)

**End of Saturday Checkpoint:**

- [ ] User can sign up
- [ ] User can sign in
- [ ] User can connect wallet
- [ ] Landing page is live
- [ ] Dashboard shows user info

---



## Phase 2: Saturday Night - Model + Inference



### Task 2.1: Select One Model

**Use: Qwen3.8-27B** (from your own documents)

- Download from Hugging Face
- Upload to S3
- Document the path



### Task 2.2: Inference Server Setup

- Spin up an EC2 instance with GPU
- Install vLLM
- Load Qwen3.8-27B
- Expose OpenAI-compatible endpoint
- Add API key authentication
- Deploy behind HTTPS



### Task 2.3: Playground Page

- One model selector (only one model)
- Prompt textarea
- Temperature slider
- Max tokens slider
- "Run" button
- Streaming response display
- Token count display
- Latency display



### Task 2.4: Backend Inference API

- Endpoint: `/api/inference`
- Accepts: prompt, model_id, temperature, max_tokens
- Calls vLLM endpoint
- Returns: response, tokens_used, latency
- Records job in Supabase



### Task 2.5: Cost Tracking

- Each inference costs 0.01 NOD (hardcoded for now)
- Create transaction record
- Deduct from user's NOD balance
- If balance insufficient, show error

**End of Saturday Night Checkpoint:**

- [ ] User can type a prompt
- [ ] User can click Run
- [ ] User receives real AI response
- [ ] Usage is recorded
- [ ] Balance is updated

---



## Phase 3: Sunday - Solana + NOD



### Task 3.1: Solana Devnet Setup

- Create a wallet for platform treasury
- Mint NOD token on Devnet
- Store mint address in environment
- Create airdrop function for testing



### Task 3.2: Balance Display

- Fetch NOD balance from chain
- Show in dashboard
- Show transaction history



### Task 3.3: Reward Mechanism

- User runs inference → consumes 0.01 NOD
- User earns 0.005 NOD as reward (50% back)
- Reward is sent as devnet transaction
- Platform earns 0.005 NOD (fee)



### Task 3.4: Transaction Log

- Store all transactions in Supabase
- Show transaction history in dashboard
- Link to Solana explorer

**End of Sunday Checkpoint:**

- [ ] User sees NOD balance
- [ ] Running inference consumes NOD
- [ ] Running inference earns NOD reward
- [ ] Transaction history is visible

---



## Phase 4: Sunday Night - GPU Node



### Task 4.1: Node Registration

- Endpoint: `/api/nodes/register`
- Creates node record with auth token
- Stores: node_id, auth_token, status='pending'



### Task 4.2: Node Heartbeat

- Endpoint: `/api/nodes/heartbeat`
- Updates: last_heartbeat, status
- If heartbeat > 60 seconds: status='offline'



### Task 4.3: Job Assignment

- Simple round-robin assignment
- Job states: queued → assigned → running → completed
- Endpoint: `/api/nodes/jobs/next` (pulls next job)
- Endpoint: `/api/nodes/jobs/:id/complete` (submits result)



### Task 4.4: Node Software

- Simple Node.js CLI
- Connects to platform
- Reports status
- Pulls jobs
- Runs inference via vLLM
- Submits results

**End of Sunday Night Checkpoint:**

- [ ] Node can register
- [ ] Node can report status
- [ ] Node can receive job
- [ ] Node can complete job
- [ ] Job is recorded

---



## Phase 5: Monday Morning - Polish + Launch



### Task 5.1: UI Polish

- Clean dashboard
- Working navigation
- Error handling
- Loading states
- Responsive design



### Task 5.2: Production Config

- Environment variables in production
- HTTPS everywhere
- Rate limiting
- Error logging



### Task 5.3: Documentation

- README
- API docs (simple)
- User guide
- Contribution guide



### Task 5.4: Launch

- Deploy to production domain
- Announce on Discord/Twitter
- First 10 users run inference

**End of Monday Checkpoint:**

- [ ] Product is live at nodai.com
- [ ] 10 users have signed up
- [ ] 10 users have run inference
- [ ] 10 users have earned NOD
- [ ] Everything actually works

---



## The Critical Path (Simplified)

```
Saturday AM: Supabase + SvelteKit + Auth
Saturday PM: Wallet + Landing Page
Saturday Night: vLLM + Inference
Sunday AM: Playground + API
Sunday PM: Solana + NOD
Sunday Night: GPU Node
Monday AM: Polish + Launch
```

---



## What Your AI Agents Need To Know



### File Structure

```
nodai/
├── apps/
│   ├── web/          (SvelteKit frontend)
│   ├── api/          (Node.js backend)
│   └── node/         (GPU node software)
├── packages/
│   ├── database/     (Supabase schemas)
│   ├── types/        (Shared TypeScript)
│   └── utils/        (Shared utilities)
├── infrastructure/
│   ├── terraform/    (AWS resources)
│   └── ansible/      (GPU server setup)
└── .env.example
```



### Environment Variables

```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_REGION=...
SOLANA_RPC_URL=...
NOD_MINT_ADDRESS=...
VLLM_API_URL=...
VLLM_API_KEY=...
```



### Supabase Schema (Minimal)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  wallet_address TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  license TEXT,
  s3_path TEXT,
  vllm_model_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inference_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  model_id UUID REFERENCES models(id),
  prompt TEXT NOT NULL,
  response TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  status TEXT DEFAULT 'queued',
  node_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('consumption', 'reward', 'fee')),
  amount NUMERIC NOT NULL,
  signature TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  last_heartbeat TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```



### Solana Token Setup

1. Create mint on Devnet
2. Mint initial supply to treasury
3. Airdrop function for testing



### AWS Setup

1. S3 bucket for models
2. EC2 GPU instance for vLLM
3. IAM roles with minimal permissions



### vLLM Command

```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen3.8-27B \
  --api-key your-secret-key \
  --port 8000 \
  --max-model-len 8192
```

---



## What Monday Looks Like

**At launch, users can:**

1. Visit nodai
2. Sign up with email
3. Connect Phantom wallet
4. See 1 model available
5. Type a prompt
6. Get a real AI response
7. See NOD balance update
8. View transaction history
9. Dashboard shows usage stats

**All of this actually works. No fakes. No demos. Real code. Real inference. Real transactions.**

---



## What's Not In Monday's MVP

- Multiple models (just 1)
- Model uploads
- Model marketplace
- Creator payments
- Multiple GPU nodes
- Complex pricing
- Anti-gaming systems
- License tracking
- Data rights
- Open-source contributions
- Community rewards
- Eval system
- Benchmark system
- Dataset system
- Any of the "coin-first community" stuff from your documents

**All of that comes later.**

---



## The Only Metric That Matters

**By Monday 9 AM, can a stranger:**

1. Open the website
2. Sign up
3. Connect their wallet
4. Type "Write a poem about AI"
5. Get a response
6. See NOD in their wallet

**If yes, you win. If no, you don't.**

Everything else is noise.

---



## Your Documents Conflict. Here's What To Ignore.

**Ignore these until after Monday:**

- "Coin-first community release schedule" (Week 1, Week 2, etc)
- "Participant onboarding brief" (long-term positioning)
- "Alternatives review" (strategy, not product)
- "Simple PRD" (too vague)
- "V1 MVP" sections 20-75 (too much)

**Use only:**

- The tech stack above
- The phases above
- The schema above

---



## Final Reality Check

You have AI agents. They can code fast. But they need:

1. **One clear spec** (you have it now)
2. **No contradictions** (you have it now)
3. **Real integrations that work** (SvelteKit + Supabase + S3 + vLLM + Solana)
4. **Deployment pipeline** (Vercel + EC2)
5. **Working end-to-end flow** (user → prompt → inference → reward)

This is doable by Monday with multiple agents working in parallel. But only if you:

1. **Stop reading the old documents**
2. **Follow this spec exactly**
3. **Don't add features**
4. **Don't second-guess**

---

**That's your plan. Go. Your agents are waiting.**