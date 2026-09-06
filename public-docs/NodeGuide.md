# Host a GPU on NodAI

NodAI does not run a cloud GPU. **Your PC** runs the model with **vLLM**. The website only sends jobs.

Live site: https://nodai-main.vercel.app  
In-app guide: `/host`

---

## Overview

```
Your PC                          NodAI website
┌─────────────────────┐          ┌──────────────────┐
│ vLLM (port 8000)    │          │ Playground       │
│   ↕                 │   jobs   │   ↓              │
│ nodai-node start    │ ←──────→ │ job queue        │
└─────────────────────┘          └──────────────────┘
```

You need **two terminals** on the GPU machine:

1. **Terminal A** — vLLM serves the model (downloads weights the first time).
2. **Terminal B** — `nodai-node start` connects this PC to NodAI.

---

## What you need

| Requirement | Notes |
| ----------- | ----- |
| **NVIDIA GPU** | 8 GB VRAM minimum for small models; **24 GB+** for Qwen3.8-27B |
| **OS** | Linux or **WSL2 on Windows** (vLLM is easiest on Linux) |
| **NVIDIA driver** | Up to date — [nvidia.com/drivers](https://www.nvidia.com/drivers) |
| **Python 3.10–3.12** | [python.org](https://www.python.org/downloads/) |
| **Node.js 18+** | For `nodai-node` — [nodejs.org](https://nodejs.org) |
| **Disk space** | ~60 GB free for the 27B model; ~15 GB for a 7B model |
| **Hugging Face account** | Free — [huggingface.co](https://huggingface.co) (for downloading models) |

---

## Part 1 — Install vLLM

### Linux (Ubuntu / native)

```bash
# Check GPU is visible
nvidia-smi

# Create a folder for AI stuff (optional but tidy)
mkdir -p ~/nodai-gpu && cd ~/nodai-gpu

# Python virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# Install vLLM (needs CUDA — install takes a few minutes)
pip install --upgrade pip
pip install vllm
```

### Windows (use WSL2)

vLLM does not run well on native Windows. Use **WSL2 + Ubuntu**:

1. Install [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) and Ubuntu from the Microsoft Store.
2. Open **Ubuntu** terminal.
3. Install NVIDIA driver on **Windows** (WSL uses it automatically).
4. Inside Ubuntu, run the same Linux commands above.

---

## Part 2 — Download and serve a model

vLLM **downloads the model automatically** from Hugging Face the first time you run `serve`. Weights are cached in `~/.cache/huggingface/` so you only download once.

### Option A — Same model as NodAI catalogue (24 GB+ VRAM)

NodAI lists **Qwen3.8-27B**. Serve it on port **8000**:

```bash
source ~/nodai-gpu/venv/bin/activate   # if using a venv

vllm serve Qwen/Qwen3.8-27B \
  --host 127.0.0.1 \
  --port 8000 \
  --max-model-len 8192
```

First run: downloads ~50 GB of weights (can take 30–90 minutes depending on internet).  
When you see `Application startup complete` or Uvicorn listening on `8000`, the model is ready.

### Option B — Smaller model for testing (8–12 GB VRAM)

If the 27B model does not fit, use a smaller Qwen for testing. You can still host on NodAI — the node uses whatever model vLLM is serving:

```bash
vllm serve Qwen/Qwen2.5-7B-Instruct \
  --host 127.0.0.1 \
  --port 8000 \
  --max-model-len 8192
```

(~15 GB download, fits on many consumer GPUs.)

### Hugging Face login (if download fails)

Some models require accepting a license on the website, then logging in:

```bash
pip install huggingface_hub
huggingface-cli login
```

Paste a token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) (Read access is enough). Run `vllm serve …` again.

### Keep vLLM running

Leave **Terminal A** open. Do not close it while hosting.

---

## Part 3 — Test vLLM locally

In a **new** terminal on the same machine:

```bash
curl http://127.0.0.1:8000/v1/models
```

You should see JSON with a `model` id (e.g. `Qwen/Qwen3.8-27B`).

Optional — send a test prompt:

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen2.5-7B-Instruct",
    "messages": [{"role": "user", "content": "Say hi in one word."}],
    "max_tokens": 32
  }'
```

Replace `model` with the id from `/v1/models` if different.

---

## Part 4 — Install the NodAI node app

Still on the **GPU machine**, in **Terminal B**:

```bash
git clone https://github.com/ZeitbyteLabs/nodai-main.git
cd nodai-main/nodai-node
npm install
npm link
```

---

## Part 5 — Create an API key (required to earn)

1. Sign in on the account that should **earn** NOD (your host account).
2. Dashboard → **Your GPUs** → **New key**.
3. Copy the `nod_…` secret. It is shown once.

Use a **second account** to run playground prompts if you are testing both sides.

---

## Part 6 — Connect to the live website

With vLLM still running in Terminal A:

```bash
nodai-node start --platform https://nodai-main.vercel.app
```

Answer the prompts (or press Enter for defaults):

| Prompt | Typical answer |
| ------ | -------------- |
| NodAI website | `https://nodai-main.vercel.app` |
| Name for this PC | `home-pc` or your choice |
| Local AI server | `http://127.0.0.1:8000` |
| vLLM API key | leave blank (unless you set one) |
| NodAI API key | paste `nod_…` from the dashboard |

When it says **this PC is online**, it appears under **Your GPUs** on the host dashboard.

To test earnings with two accounts:

1. On the **user** account: Dashboard → **Get NOD** → Playground → **Run**
2. Terminal B should show `Got a job` → `Done` · host earned a share of the token cost
3. On the **host** account: Dashboard shows the job, **To claim** increases, Claim pays the wallet

Already registered without a key? Run `nodai-node start` again and paste the API key when asked (or `--api-key nod_…`). That links this PC to your account.

Stop hosting: **Ctrl+C** in the `nodai-node` window. Stop vLLM with **Ctrl+C** in Terminal A.

---

## Commands

| Command | Meaning |
| -------- | ------- |
| `nodai-node start` | Set up (if needed) + wait for jobs |
| `nodai-node status` | Check website + local vLLM |
| `nodai-node setup` | Register only, do not wait for jobs |

---

## Troubleshooting

| Problem | What to try |
| ------- | ----------- |
| `nvidia-smi` not found | Install/update NVIDIA drivers |
| CUDA out of memory | Use a smaller model (7B) or lower `--max-model-len` |
| vLLM install fails | Use Linux/WSL2; Python 3.10–3.12; `pip install vllm` in a fresh venv |
| Model download slow / fails | Check disk space; run `huggingface-cli login` |
| `nodai-node` says local AI server not running | Start vLLM first; check `curl http://127.0.0.1:8000/v1/models` |
| API key required / invalid | Create a key on Dashboard → Your GPUs. It starts with `nod_` |
| Node online but no earnings | Link the node: `nodai-node start --api-key nod_…` on the host account |
| Playground stuck on “Queued” | Keep `nodai-node start` running; check dashboard Network shows your node **online** |
| Job fails | Check Terminal B for errors; vLLM may have crashed |

---

## Local dev (website on your laptop)

```bash
# Terminal A — vLLM (same as above)

# Terminal B — node pointing at local SvelteKit
cd nodai-main && npm run dev   # in another project terminal

nodai-node start --platform http://localhost:5173 --label home-gpu
```

---

## Where models come from

| What | Where |
| ---- | ----- |
| Model weights | [Hugging Face](https://huggingface.co) — downloaded by vLLM on first `serve` |
| Cache folder | `~/.cache/huggingface/hub/` |
| NodAI catalogue name | `Qwen/Qwen3.8-27B` (must match what vLLM serves for best results) |

You do **not** upload models to NodAI. You run them locally; the node sends only **prompts** and **answers** to the website.
