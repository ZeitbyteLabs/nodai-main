# GPU Node Guide

How to connect a machine running vLLM to the NodAI network.

---

## Requirements

- **Node.js 18+**
- **vLLM** running locally (port 8000)
- **NodAI app** running with the node API enabled

---

## 1. Start vLLM

On your GPU machine (RunPod, local desktop, etc.):

```bash
vllm serve Qwen/Qwen3.8-27B \
  --host 0.0.0.0 \
  --port 8000 \
  --api-key YOUR_VLLM_KEY
```

Expose port **8000** if you are on a cloud provider. The node CLI talks to vLLM at `http://127.0.0.1:8000` on the same machine.

---

## 2. Install the node CLI

From the repository:

```bash
cd nodai-node
npm link
```

Or run directly:

```bash
node bin/nodai-node.mjs <command>
```

---

## 3. Register your node

```bash
nodai-node register \
  --platform https://your-nodai-app.com \
  --label my-gpu \
  --vllm http://127.0.0.1:8000
```

Credentials save to `./.nodai/node.json`. **Never commit this file.**

---

## 4. Start the worker

```bash
nodai-node run
```

The worker loops forever: heartbeat → pull job → vLLM → submit result.

For background on RunPod:

```bash
nohup nodai-node run > /workspace/nodai-node.log 2>&1 &
tail -f /workspace/nodai-node.log
```

---

## Commands

| Command | Description |
| -------- | ----------- |
| `register --platform URL --label NAME` | Register with NodAI, save token |
| `run` | Start worker loop |
| `run --once` | Process one job and exit |
| `status` | Check platform + vLLM connectivity |
| `config` | Show saved config (token masked) |

---

## Environment variables

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `NODAI_PLATFORM_URL` | `http://localhost:5173` | NodAI app URL |
| `VLLM_API_URL` | `http://127.0.0.1:8000` | Local vLLM server |
| `VLLM_API_KEY` | empty | vLLM bearer token if set |

---

## Local dev test

**Terminal 1** — NodAI app:

```bash
cd nodai-main && npm run dev
```

**Terminal 2** — vLLM on your GPU.

**Terminal 3** — Node CLI:

```bash
cd nodai-node
nodai-node register --platform http://localhost:5173 --label dev-gpu
nodai-node run
```

Queue a job via `POST /api/jobs` (signed-in user). See [`API.md`](API.md) for endpoint details.

---

## Verify

With the dev server running:

```bash
cd nodai-node
npm run verify
```

---

## API reference

Node HTTP endpoints: [`API.md`](API.md#node-endpoints)

Full CLI details: [`../nodai-node/README.md`](../nodai-node/README.md)
