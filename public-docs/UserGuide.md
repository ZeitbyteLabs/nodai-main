# NodAI User Guide

How to use NodAI from sign-up through your first inference run. GPU hosts earn NOD — running a prompt does not.

---

## 1. Create an account

1. Go to **Get started** on the home page.
2. Pick a username (3–24 characters, letters, numbers, underscores).
3. Enter email and password (minimum 8 characters).
4. Confirm your email if Supabase sends a confirmation link.
5. Sign in — you land on the **Dashboard**.

---

## 2. Get NOD credit

Inference is priced by **output tokens**: **0.02 NOD per 1,000 tokens** (minimum **0.001 NOD**). A typical run reserves a few hundredths of NOD and refunds what you do not use. For devnet testing:

1. Open the **Dashboard**.
2. In the NOD panel, click **Get NOD**.
3. Your balance updates — this is off-chain credit used to pay for runs.

This is separate from NOD in your Solana wallet (claimed rewards).

---

## 3. Run inference

1. Open **Playground** from the nav.
2. Write a prompt (up to 8,000 characters).
3. Adjust **Temperature** and **Max tokens** if needed.
4. Click **Run** — the job waits until a community GPU picks it up.
5. You pay for the **output tokens** actually generated. You do not earn NOD by running prompts — hosts earn a share of that token cost.

If the run button is disabled:

- Balance too low → get NOD on the dashboard
- No GPU online → start `nodai-node` on a host PC, or wait for one
- No models listed → nothing is published yet

---

## 4. Connect a wallet

To claim NOD you earned by **hosting** a GPU:

1. Install [Phantom](https://phantom.app/) (or another supported wallet).
2. On the **Dashboard**, click **Connect Phantom**.
3. Approve the connection in your wallet extension.

Your wallet address appears in the NOD panel.

---

## 5. Claim NOD

1. Complete at least one job as a GPU host (API key + `nodai-node start`).
2. On the **Dashboard**, check **To claim** in the NOD panel.
3. Click **Claim NOD**.
4. Confirm the transaction in your wallet.

Claimed NOD appears under **In wallet**. View transactions on [Solana Explorer](https://explorer.solana.com/?cluster=devnet) (devnet).

Devnet NOD is for testing only and has no monetary value.

---

## 6. Dashboard activity

The **Activity** section lists every run, reward, fee, and top-up with timestamps. On-chain claims include an explorer link.

---

## 7. Browse models

The **Models** page shows what is currently served on the network — name, description, licence, and vLLM target. Click **Run inference** to open the playground.

---

## Need help?

- In-app guide: `/guide`
- API reference: [`API.md`](API.md)
- Host a GPU: [`NodeGuide.md`](NodeGuide.md)
