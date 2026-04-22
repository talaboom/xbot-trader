**To:** [recipient@benchsci.com]
**From:** ivan@sync-security.com
**Subject:** 282 GB HBM3e in Mississauga for long-context biomedical LLMs — CAD $4/hr

---

Hi [Name],

BenchSci's work on biomedical reasoning is exactly the kind of workload I had in mind when I started spec'ing this. I'm bringing up a small bare-metal GPU node in Mississauga — 2x Nvidia H200 NVL, 282 GB HBM3e total — aimed at Toronto AI teams who need big VRAM for long context and don't want to babysit a shared queue.

Indicative pricing: **CAD $4/hr per card, bare-metal, root access, no egress fees, Canadian data residency.**

Three reasons I think this could matter for BenchSci:

1. **282 GB HBM3e lets you fit 70B-class biomedical models with very long context** (full papers, multi-document reasoning chains) without aggressive quantization or offloading.
2. **Bare-metal means deterministic benchmarks.** No noisy neighbors — helpful when you're measuring retrieval quality gains from a fine-tune.
3. **Hourly billing** means short evaluation bursts (overnight runs, ablation sweeps) don't require a month-long commit.

I'm collecting non-binding Letters of Intent from Toronto-area AI teams to support an RBC loan application. It's a one-page fillable PDF — you'd estimate monthly GPU-hours at the indicative rate, sign, and send back. Non-binding, no payment obligation. It helps me prove local demand to my lender.

Would a 15-minute call with whoever runs training infra at BenchSci make sense this week?

Thanks,
Ivan Stavrikov
SyncSecurity
ivan@sync-security.com · 416-837-1697
