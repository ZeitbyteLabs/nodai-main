# NodAI

The Open AI Network — share models, run inference, earn NOD.

NodAI is an MVP platform built with SvelteKit, Supabase, vLLM, and Solana devnet. Users sign up, run real inference against a production model, and earn NOD rewards they can claim to a connected wallet.

**Repository:** [github.com/ZeitbyteLabs/nodai-main](https://github.com/ZeitbyteLabs/nodai-main)

## Repository layout

| Path | What it is |
| ---- | ---------- |
| `nodai-main/` | SvelteKit web app (auth, playground, dashboard, API) |
| `nodai-node/` | GPU node CLI — register, heartbeat, pull jobs, run vLLM |
| `public-docs/` | User guide, API reference, GPU node guide |

## Quick start (local dev)

**1. Supabase**

Create a project and run all migrations in `nodai-main/supabase/migrations/` (0001 through 0004).

**2. App**

```bash
cd nodai-main
cp .env.example .env   # fill in Supabase keys
npm install
npm run nod:setup      # creates NOD mint + treasury (once)
npm run dev
```

**3. vLLM**

Start vLLM on a GPU machine and set `VLLM_API_URL` + `VLLM_API_KEY` in `.env`. See [`public-docs/NodeGuide.md`](public-docs/NodeGuide.md) for GPU setup.

**4. Verify**

```bash
cd nodai-main
npm run verify:phase4

cd ../nodai-node
npm run verify
```

Open [http://localhost:5173](http://localhost:5173).

## Documentation

| Doc | Purpose |
| --- | ------- |
| [`public-docs/UserGuide.md`](public-docs/UserGuide.md) | End-user walkthrough |
| [`public-docs/API.md`](public-docs/API.md) | HTTP API reference |
| [`public-docs/NodeGuide.md`](public-docs/NodeGuide.md) | GPU operator setup |
| [`nodai-node/README.md`](nodai-node/README.md) | Node CLI reference |

In-app user guide: `/guide`

## MVP features

- Email/password auth with usernames
- Solana wallet connect (Phantom)
- Playground with streaming inference (Qwen3.8-27B via vLLM)
- NOD economy — off-chain credit, on-chain claim on devnet
- GPU node registration and job queue
- Dashboard with balance, activity, and network status

## Tech stack

- **Frontend:** SvelteKit 2, Svelte 5, Tailwind CSS 4
- **Backend:** Supabase (Auth + PostgreSQL)
- **Inference:** vLLM (OpenAI-compatible API)
- **Blockchain:** Solana devnet, SPL token (NOD)
- **Node software:** Node.js CLI (`nodai-node`)

## License

See individual packages and model licences. NOD on devnet is for testing and has no monetary value.
