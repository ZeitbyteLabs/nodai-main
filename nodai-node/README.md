# NodAI GPU Node CLI

Connects a machine running vLLM to the NodAI platform. Registers the node,
sends heartbeats, pulls queued jobs, runs inference locally, and submits results.

## Requirements

- **Node.js 18+**
- **vLLM** running locally (e.g. on RunPod port 8000)
- **NodAI app** running with Phase 4 API (`npm run dev` in `nodai-main`)

## Install

From this directory:

```bash
npm link
```

Or run directly:

```bash
node bin/nodai-node.mjs <command>
```

## Quick start (RunPod)

**1. Start vLLM** on the GPU box (port 8000). See [`public-docs/NodeGuide.md`](../public-docs/NodeGuide.md).

**2. Register this machine as a node:**

```bash
nodai-node register \
  --platform https://your-nodai-app.com \
  --label runpod-h100 \
  --vllm http://127.0.0.1:8000
```

Credentials save to `./.nodai/node.json`.

**3. Start the worker:**

```bash
nodai-node run
```

The worker loops forever: heartbeat → pull job → vLLM → submit result.

For background on RunPod:

```bash
nohup nodai-node run > /workspace/nodai-node.log 2>&1 &
tail -f /workspace/nodai-node.log
```

## Commands

| Command | Description |
| -------- | ----------- |
| `register --platform URL --label NAME` | Register with NodAI, save token |
| `run` | Start worker loop |
| `run --once` | Process one job and exit |
| `status` | Check platform + vLLM connectivity |
| `config` | Show saved config (token masked) |

## Environment variables

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `NODAI_PLATFORM_URL` | `http://localhost:5173` | NodAI app URL |
| `VLLM_API_URL` | `http://127.0.0.1:8000` | Local vLLM server |
| `VLLM_API_KEY` | empty | vLLM bearer token if set |

## Local dev test

Terminal 1 — NodAI app:

```bash
cd nodai-main && npm run dev
```

Terminal 2 — vLLM on RunPod or local GPU.

Terminal 3 — Node CLI:

```bash
cd nodai-node
nodai-node register --platform http://localhost:5173 --label dev-gpu
nodai-node run
```

Queue a job from the app (via API `POST /api/jobs`) or playground once queue mode is wired.

## Config file

`./.nodai/node.json`:

```json
{
  "platformUrl": "http://localhost:5173",
  "vllmUrl": "http://127.0.0.1:8000",
  "vllmApiKey": "",
  "nodeId": "uuid",
  "authToken": "secret",
  "label": "my-gpu",
  "pollIntervalMs": 3000,
  "heartbeatIntervalMs": 30000
}
```

**Never commit this file.** It contains the node auth token.
