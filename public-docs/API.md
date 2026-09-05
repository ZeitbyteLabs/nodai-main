# NodAI API Reference

Simple HTTP API for the NodAI platform.

Base URL: your app origin (e.g. `http://localhost:5173`).

---

## User endpoints

### `POST /api/inference`

Run streaming inference (playground). Requires sign-in.

**Body:**

```json
{
  "prompt": "Hello",
  "model_id": "uuid",
  "temperature": 0.7,
  "max_tokens": 512
}
```

**Response:** Server-sent events stream.


| Event   | Fields                                           |
| ------- | ------------------------------------------------ |
| `start` | `balance`                                        |
| `delta` | `text`                                           |
| `done`  | `balance`, `tokens_used`, `latency_ms`, `reward` |
| `error` | `message`                                        |


Costs **0.01 NOD** per run; earns **0.005 NOD** reward on success.

---



### `POST /api/jobs`

Queue an inference job for GPU nodes. Requires sign-in. Debits NOD balance.

**Body:**

```json
{
  "prompt": "Hello",
  "model_id": "uuid",
  "temperature": 0.7,
  "max_tokens": 512
}
```

**Response:** `{ "job_id": "uuid", "status": "queued" }`

---



### `GET /api/nod/balance`

Returns NOD credit, pending rewards, wallet link status, and on-chain balance.

---



### `POST /api/nod/faucet`

Add test NOD credit (devnet). Requires sign-in.

---



### `POST /api/nod/claim`

Claim pending rewards to connected wallet on Solana devnet. Requires sign-in + linked wallet.

---



### `GET /api/username/check?username=NAME`

Check username availability. Public.

---



### `POST /api/wallet`

Link or unlink a Solana wallet address. Requires sign-in.

---



### `GET /api/nodes`

Public list of registered GPU nodes and status.

---



## Node endpoints

Node routes use `Authorization: Bearer <auth_token>` from registration.

### `POST /api/nodes/register`

Register a new GPU node. Public.

**Body:** `{ "label": "my-gpu" }`

**Response:** `{ "node_id", "auth_token", "label" }`

---



### `POST /api/nodes/heartbeat`

Keep node online. Nodes go offline after 60 seconds without a heartbeat.

**Body:** `{ "status": "online" }`

---



### `POST /api/nodes/jobs/next`

Pull the next queued job for this node.

**Response:** `{ "job": null }` or `{ "job": { "id", "prompt", "model_id", "vllm_model_name", "temperature", "max_tokens" } }`

---



### `POST /api/nodes/jobs/:id/complete`

Submit job result.

**Body (success):**

```json
{
  "status": "completed",
  "response": "…",
  "tokens_used": 42,
  "latency_ms": 1200
}
```

**Body (failure):** `{ "status": "failed", "response": "" }`

---



## Node CLI

See `[../nodai-node/README.md](../nodai-node/README.md)` for the `nodai-node` worker that wraps these endpoints.

---



## Economy (devnet MVP)


| Action        | NOD    |
| ------------- | ------ |
| Run inference | −0.01  |
| User reward   | +0.005 |
| Platform fee  | +0.005 |
| Faucet top-up | +1.00  |


All amounts are hardcoded in `nodai-main/src/lib/config.ts`.