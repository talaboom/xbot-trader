**To:** [recipient@untether.ai]
**From:** ivan@sync-security.com
**Subject:** H200 reference box for inference benchmarking — CAD $4/hr, Mississauga bare-metal

---

Hi [Name],

When you're benchmarking custom inference silicon, access to a clean, reproducible H200 reference is often the most annoying piece of the puzzle — shared clouds introduce scheduling noise exactly where you don't want it. I'm spinning up a bare-metal node in Mississauga (2x Nvidia H200 NVL, 282 GB HBM3e) and I think it could serve as a useful reference box for Untether's benchmarking work.

Indicative rate: **CAD $4/hr per card, bare-metal, root access, no shared tenancy, no egress fees.**

Why I think this could fit Untether AI's workflow:

- **Deterministic benchmarks.** Bare-metal with no co-tenants means you can run head-to-head comparisons against Untether silicon without cloud-induced variance.
- **Model porting.** 282 GB HBM3e holds basically any open-weights checkpoint you'd want to port — Llama 3.1 405B Q4, DeepSeek, Qwen, Mixtral — without offloading.
- **Hourly.** Benchmark runs are bursty; hourly billing beats monthly reservations on the US clouds.

I'm collecting non-binding Letters of Intent from Toronto-area AI companies to support an RBC loan application. One-page fillable PDF, you estimate GPU-hours/month at the indicative rate, sign, send back. Non-binding, no payment obligation — purely evidence of local demand.

Happy to answer spec questions or set up a short call.

Thanks,
Ivan Stavrikov
SyncSecurity
ivan@sync-security.com · 416-837-1697
