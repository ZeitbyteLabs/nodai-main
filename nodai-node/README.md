# NodAI GPU Node

A small app that connects **this computer** to NodAI. Your GPU runs the model. NodAI only sends jobs.

## What you do (3 steps)

**1. Start the model** on this PC (leave the window open):

```bash
vllm serve Qwen/Qwen3.8-27B --host 127.0.0.1 --port 8000
```

**2. Install the node app** (once):

```bash
cd nodai-node
npm install
npm link
```

**3. Create an API key** on the host account dashboard (**Your GPUs → New key**).

**4. Connect to the live website:**

```bash
nodai-node start --platform https://nodai-main.vercel.app
```

Paste the `nod_…` API key when asked. Leave that window open. Earnings show on that dashboard.

Then open [the playground](https://nodai-main.vercel.app/playground) and run a prompt. This PC should pick it up.

Press **Ctrl+C** to stop.

## Commands

| Command | Meaning |
| -------- | ------- |
| `nodai-node start` | Set up if needed, then wait for jobs |
| `nodai-node status` | Check website + local AI server |
| `nodai-node setup` | Register only |
| `nodai-node run --once` | One job, then exit |

## Test against your own site locally

```bash
nodai-node start --platform http://localhost:5173 --label home-gpu
```

## Config

Saved at `./.nodai/node.json`. Do not share or commit it — it has the node password.
