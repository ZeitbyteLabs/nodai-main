# Host a GPU on NodAI

NodAI does not run a cloud GPU. Your PC runs the model. The website only sends jobs.

Live site: https://nodai-main.vercel.app  
In-app page: `/host`

---

## You need

- NVIDIA GPU (8 GB+ VRAM; 24 GB is better for the 27B model)
- [Node.js 18+](https://nodejs.org)
- vLLM (or any OpenAI-compatible server) on this machine

---

## 1. Start the model

```bash
vllm serve Qwen/Qwen3.8-27B --host 127.0.0.1 --port 8000
```

Leave this window open. Nothing needs to be public on the internet.

---

## 2. Install the node app (once)

```bash
git clone https://github.com/ZeitbyteLabs/nodai-main.git
cd nodai-main/nodai-node
npm install
npm link
```

---

## 3. Connect to the live website

```bash
nodai-node start --platform https://nodai-main.vercel.app
```

Press Enter for defaults. Leave the window open.

When it says this PC is online, open the playground on your phone or another tab and press Run. This GPU should pick up the job in a few seconds.

Stop with **Ctrl+C**.

---

## Commands

| Command | Meaning |
| -------- | ------- |
| `nodai-node start` | Set up + wait for jobs |
| `nodai-node status` | Check website + local model |
| `nodai-node setup` | Register only |

---

## Local website instead of live

```bash
nodai-node start --platform http://localhost:5173 --label home-gpu
```
