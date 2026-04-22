**To:** [recipient@canvass.io]
**From:** ivan@sync-security.com
**Subject:** H200 compute for industrial time-series training — CAD $4/hr, Mississauga

---

Hi [Name],

Canvass's focus on industrial AI is one of the few domains where training data is genuinely gnarly — high-dimensional sensor telemetry, long sequences, noisy labels — and where customer IP sensitivity means a lot of it shouldn't leave Canada. I'm bringing up a bare-metal GPU node in Mississauga (2x Nvidia H200 NVL, 282 GB HBM3e) aimed at exactly these workloads.

Indicative rate: **CAD $4/hr per card, bare-metal, root, no egress fees, Canadian data residency.**

Why I think this could fit Canvass AI:

- **282 GB HBM3e.** Long-sequence time-series transformers benefit directly from large VRAM — no sliding-window tricks forced on you.
- **Canadian residency.** Industrial customers (mining, refining, chemicals) tend to have strict data-movement clauses. This node keeps you on-side by default.
- **Bare-metal + root.** You can install custom preprocessing stacks (Arrow, DuckDB, Polars, whatever) without cloud-image friction.
- **Hourly.** Training runs for a new customer onboarding are bursty; hourly beats reserved instances.

I'm collecting non-binding Letters of Intent from Toronto-area AI companies to support an RBC loan application. One-page fillable PDF: estimate monthly GPU-hours at the indicative rate, sign, return. Non-binding, no payment obligation.

Would a 15-minute call make sense this week to walk through the spec?

Thanks,
Ivan Stavrikov
SyncSecurity
ivan@sync-security.com · 416-837-1697
