# NodAI Coin-First Community Release Schedule

Date: 2026-09-04
Status: Approved direction from Zeitbyte in Discord. This report supersedes the marketplace-first sequencing in the earlier NodAI PRDs where they conflict.

## Core repositioning

NodAI should not launch as “an AI marketplace with a token.”

NodAI should launch as:

> An open-source, local-first AI contributor network with a native reward asset.

The first thing we are building is the community and the coin. The product exists to make that community credible: people publish models, improve model cards, run evals, contribute docs/code, and optionally contribute local compute. Verified contributors earn NOD.

Marketing hook:

> This community has value. Did you get paid?

That is the angle that connects to the Hugging Face / Nvidia moment: open AI communities create enormous value, and contributors usually do not share in it. NodAI’s answer is open source, local-first, transparent rewards, and community ownership.

## Public language guardrail

Do not publicly promise that NOD is tied to company value, acquisition proceeds, or future sale payouts. That is securities-risk language.

Allowed public frame:

- NOD rewards verified contributors.
- NOD is the native asset of the open NodAI network.
- NOD will be used for community rewards, ecosystem access, and future network utility.
- Distribution rules and reward epochs are transparent.

If the company wants profit-sharing, acquisition participation, or sale-proceeds economics, that needs legal structuring before it is marketed.

## Legal & Reputation Guardrails

This section is issue-spotting, not legal advice. Before any mainnet token, public sale, exchange listing, transferability push, or “buy NOD” campaign, NodAI needs review by counsel familiar with crypto/securities, payments, tax, privacy, and IP.

### Securities-law risk

The highest-risk framing is any version of:

- NOD is tied to the value of the company.
- NOD holders profit if NodAI is acquired.
- Buy NOD now because the network will become valuable.
- Contributors are investing labor/money for future financial upside.

That framing can make NOD look like an unregistered security. The safer public position is that NOD rewards verified useful work and provides network utility. Do not create an expectation of profit from the efforts of the NodAI team.

### Fraud-prevention rules

Fraud risk comes from mismatch between claims and reality.

Do not:

- claim community ownership while insiders secretly control mint/treasury,
- claim local-first while quietly routing private prompts/data through centralized servers,
- claim contributors “get paid” if they only receive illiquid points or tokens with no disclosed limitations,
- fake GPU nodes, inference, usage, benchmarks, community activity, or demand,
- sell or license community data without explicit rights.

Public claims must match implemented mechanics.

### Money transmission, custody, AML, sanctions

If NOD becomes transferable or redeemable for real value, NodAI may trigger money-transmission, KYC/AML, sanctions-screening, consumer-protection, and tax-reporting obligations.

Until counsel says otherwise:

- keep NOD on devnet,
- state clearly that devnet NOD has no monetary value,
- do not sell NOD,
- do not promise exchange listing,
- do not custody user funds,
- do not promise withdrawals or cash conversion.

### Contributor reward and tax risk

If people receive tokens for work, those rewards may be treated as compensation or taxable income depending on jurisdiction.

The project needs a written reward policy covering:

- whether points are off-chain reputation only,
- whether NOD distributions are grants, rewards, compensation, contest prizes, or network emissions,
- who is eligible,
- anti-sybil rules,
- dispute handling,
- tax/reporting limitations,
- cross-border contributor restrictions if any.

### Data rights and IP licensing

If community contributions later become valuable datasets, benchmarks, evals, prompts, model improvements, or usage data, NodAI needs explicit rights before commercial use.

Required before any data monetization:

- contributor license agreement,
- model/dataset license compatibility checks,
- provenance tracking,
- takedown process,
- privacy policy,
- consent for usage-data collection,
- deletion/export handling where required,
- no implied ownership of user content without clear terms.

### Open-source trust risk

A Hugging Face alternative cannot tolerate license laundering.

The platform needs:

- license selection required at upload,
- SPDX-style license metadata,
- provenance/attribution fields,
- report/takedown flow,
- admin review for suspicious uploads,
- no commercial use of models/datasets whose licenses prohibit it.

### Reputation guardrails

The brand should feel like open infrastructure with transparent rewards, not a token with a model marketplace attached.

Avoid:

- crypto cash-grab language,
- guaranteed earnings,
- “your GPU will make you money” before the economics exist,
- rewarding raw volume over useful contribution,
- hidden insider allocations,
- surprise changes to reward rules after people contribute.

Prefer:

- transparent reward epochs,
- public distribution logs,
- quality gates,
- clear eligibility rules,
- open governance later,
- honest limits on what NOD is and is not.

### Prohibited public claims until counsel approves

- NOD is an investment.
- NOD tracks company equity or company value.
- NOD holders share in acquisition proceeds.
- Buying NOD gives exposure to NodAI’s future sale.
- Contributors are guaranteed payment.
- GPU providers are guaranteed income.
- NOD will be listed on an exchange.

### Allowed public claims

- NodAI is open-source and local-first.
- NodAI tracks useful community contribution transparently.
- Contributors can earn NOD for verified work.
- NOD is being tested on Solana Devnet.
- Devnet NOD is for testing and has no promised monetary value.
- Reward rules and distributions are public.
- The long-term goal is a community-owned AI network.

### Launch gate

No mainnet token, public sale, transferability campaign, exchange listing, paid withdrawal system, or “buy NOD” marketing until counsel signs off on the exact structure and copy.


## Competitive benchmark stack

A September 2026 review of Hugging Face alternatives concluded that replacing Hugging Face is a portfolio problem, not a clone problem. NodAI should use existing platforms as benchmarks without copying their center of gravity:

- ModelScope = benchmark for model/dataset hub completeness.
- Ollama = benchmark for local-first UX.
- Civitai = benchmark for community/creator energy.
- Replicate = benchmark for managed inference later.
- W&B / Valohai = benchmark for provenance, eval lineage, and reproducibility later.

NodAI should not try to out-Hugging Face Hugging Face. It should combine the smallest useful pieces from existing platforms and make contributor rewards first-class.

Full review: Hugging Face Alternatives Review — Impact on NodAI + Coverage Percentages (`47e9a1f4-c55d-4ad0-a287-213a1e09f7cd`).

## Release schedule

### Weekend — Sep 4–6: Brand + Devnet Coin + Community Skeleton

Goal: make NodAI real enough for people to join, follow, and contribute.

Ship:

- Public landing page: “The open, local-first AI network.”
- Manifesto: open-source models, open community, contributors earn NOD, no data-center lock-in.
- Public GitHub repo/org skeleton:
  - README
  - roadmap
  - contribution guide
  - code of conduct
  - reward rules draft
- Solana Devnet NOD mint + metadata + treasury wallet.
- Wallet connect on the site.
- Supabase schema for:
  - profiles
  - wallets
  - contribution_events
  - contribution_points
  - reward_distributions
- Public transparency page:
  - contributors
  - points issued
  - devnet NOD distributions
  - reward rules

Gate: a non-technical person can understand the mission, join the waitlist/Discord, connect a devnet wallet, and see how contributors earn.

### Week 1 — Sep 7–13: Hugging Face Alternative Alpha

Goal: prove the community creates the asset.

Ship:

- Model hub alpha:
  - create model page
  - model card / README
  - tags
  - license
  - version
  - upload files to S3 via presigned URLs
  - browse/search/download
- Creator profiles.
- Contribution events for:
  - publishing a model
  - improving a model card
  - submitting docs
  - opening a useful issue
  - accepted PR
  - adding an eval/benchmark
- Points ledger v1.

Gate: a creator can publish a real small open model and another user can find/download it.

### Week 2 — Sep 14–20: Contributor Rewards Alpha

Goal: introduce the coin as a participation reward, not a speculative pitch.

Ship:

- Weekly reward epoch.
- Points → devnet NOD distribution.
- Public distribution log.
- Contributor leaderboard.
- Reward categories:
  - model publishing
  - evals/benchmarks
  - dataset/model documentation
  - code PRs
  - docs
  - community moderation/support
- Anti-gaming rules:
  - no self-dealing
  - no spam uploads
  - accepted contributions only
  - admin review for high-value rewards

Gate: 5–10 external contributors can earn points and receive devnet NOD transparently.

### Week 3 — Sep 21–27: Managed Inference POC

Goal: prove the models are useful without building the GPU marketplace yet.

Ship:

- vLLM behind a controlled NodAI API.
- Playground for 1–2 approved open models.
- Usage logging:
  - prompt tokens
  - output tokens
  - latency
  - model
  - user
- Optional “run costs points/NOD later” accounting, but no public payment rail yet.

Gate: a user can run a real prompt against a real model and see real usage recorded.

### Week 4 — Sep 28–Oct 4: Local-First Community Node Preview

Goal: show the future “your GPU can matter” story without launching a rental market.

Ship:

- Local-first node app/CLI preview:
  - install
  - connect wallet/account
  - report hardware
  - heartbeat
  - opt-in availability
  - run approved local/community tasks
- No bidding.
- No hourly rental marketplace.
- No “rent your GPU to strangers” UX yet.
- Position it as: “contribute compute to the open network and earn participation rewards.”

Gate: an external non-staff user can install the node preview and appear online in the network dashboard.

### Weeks 5–6 — Oct 5–18: Data/Eval Flywheel

Goal: create the valuable open asset: better open models through community refinement.

Ship:

- Benchmark/eval submission flow.
- Dataset/model improvement tasks.
- Public eval leaderboards.
- Model refinement queue:
  - missing docs
  - bad model cards
  - broken configs
  - needed evals
  - license cleanup
- Consent/data-rights framework for contributed data.
- Impact score v1 for contributors.

Gate: the community is producing measurable model-quality or dataset-quality improvements, not just signups.

### Weeks 7–8 — Oct 19–Nov 1: Token Mainnet Readiness

Goal: decide whether NOD is ready to leave devnet.

Ship:

- Legal review.
- Tokenomics doc.
- Distribution schedule.
- Treasury policy.
- Contributor allocation policy.
- Security review for wallet/token flows.
- Public comms guide:
  - allowed: “earn NOD for verified contribution”
  - not allowed: “buy NOD because the company may be acquired”
- Audit plan for on-chain components.

Gate: counsel + security signoff. No mainnet launch without it.

### Week 9+ — Nov 2 onward: Public Beta / Infrastructure Rollout

Only after the above gates pass:

- Public beta launch.
- Open-source release campaign.
- API keys + OpenAI-compatible endpoint.
- Expanded model support.
- More community nodes.
- GPU network expansion.
- Reputation system.
- Admin/moderation tooling.
- Later: marketplace pricing, enterprise licensing, data-sale/commercialization structure if legally approved.

## Explicitly deferred

Do not build these into the first tranche:

- GPU rental marketplace
- GPU bidding
- hourly provider pricing
- complex provider economy
- DAO
- staking
- DeFi
- token bridge
- cross-chain
- mainnet launch
- enterprise data-sale flow
- acquisition/profit-sharing promises

## Execution rule

Do not build from the full 75-section PRD directly.

Convert only the first tranche into execution specs:

1. Weekend brand/devnet/community skeleton
2. Week 1 model hub alpha
3. Week 2 contributor rewards alpha

Everything else stays roadmap until the first tranche ships.

## Success metrics

Track these from day one:

- waitlist signups
- Discord joins
- GitHub stars / forks / contributors
- wallets connected
- models published
- model card improvements
- eval submissions
- accepted PRs/docs
- points issued
- devnet NOD distributed
- local node installs
- real inference requests

## Open implementation questions for Wassi / A~4BT~

- Repo/org name for the public open-source launch.
- Who owns Solana Devnet mint creation and metadata.
- Whether the first node preview is CLI-only or has a minimal desktop shell.
- S3 bucket naming and upload constraints for the model hub alpha.
- Whether reward points are purely off-chain in Supabase for Week 2, with devnet NOD distribution as a separate transparent batch.
- Landing page copy owner: Zeitbyte voice, not generic crypto copy.
