# NodAI

The Open AI Network — share models, run inference, earn NOD.

NodAI is a website plus a tiny GPU app. Users run prompts. **Community machines** answer them. NodAI does not rent RunPod or AWS for inference.

**Live:** [nodai-main.vercel.app](https://nodai-main.vercel.app)  
**Repo:** [github.com/ZeitbyteLabs/nodai-main](https://github.com/ZeitbyteLabs/nodai-main)

## Layout

| Path | What it is |
| ---- | ---------- |
| `nodai-main/` | Website (auth, playground, dashboard, job queue) |
| `nodai-node/` | App you run on a home GPU |
| `public-docs/` | User guide, API, host guide |

## Local website

```bash
cd nodai-main
cp .env.example .env
npm install
npm run nod:setup
npm run dev
```

Inference needs a host PC, not env vars on the website.

After pulling host-earnings changes, run `nodai-main/supabase/migrations/0005_host_earnings.sql` in the Supabase SQL Editor.

## Connect a home GPU to the live site

On the GPU computer:

1. Sign in, create an API key on the dashboard
2. Start vLLM on port 8000
3. `cd nodai-node && npm install && npm link`
4. `nodai-node start --platform https://nodai-main.vercel.app` (paste the API key)

Full steps (vLLM install + model download): [public-docs/NodeGuide.md](public-docs/NodeGuide.md) or `/host` on the site.

## Docs

| Doc | Purpose |
| --- | ------- |
| [`public-docs/UserGuide.md`](public-docs/UserGuide.md) | End users |
| [`public-docs/NodeGuide.md`](public-docs/NodeGuide.md) | Host a GPU — vLLM install, model download, nodai-node |
| [`public-docs/API.md`](public-docs/API.md) | HTTP API |
| [`nodai-node/README.md`](nodai-node/README.md) | Node commands |

## License

NOD on devnet is for testing and has no monetary value.
