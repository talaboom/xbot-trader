**To:** [recipient@private-ai.com]
**From:** ivan@sync-security.com
**Subject:** Local H200 compute for PII-redaction model training — Mississauga, CAD $4/hr

---

Hi [Name],

I've followed Private AI's work on PII redaction for a while — the fact that you've stayed firmly on the "data never leaves the customer" side of the line is why I'm writing. I'm standing up a small bare-metal GPU node in Mississauga (2x Nvidia H200 NVL, 282 GB HBM3e total) specifically for Canadian AI teams who can't or won't ship training data to US hyperscalers.

Indicative pricing is **CAD $4/hr per card, bare-metal, no egress fees, Canadian data residency by default.** No shared tenancy, no vendor lock-in, and I can hand you root on the box.

Two reasons I think this might be a fit for Private AI:

1. **PII-redaction fine-tuning is exactly the workload that should never leave the country.** Our node sits in a Mississauga colo — your training corpora never cross a border.
2. **282 GB of HBM3e gives you room to train redaction models over genuinely long contexts** (legal docs, medical records, multi-turn transcripts) without sharding hacks.

I'm collecting non-binding Letters of Intent from Toronto-area AI teams to demonstrate market demand to my lender (RBC CSBFL). The LOI is a one-page, fillable PDF — you estimate GPU-hours/month at the indicative rate, sign, send back. Zero commitment, no payment obligation, purely a signal.

Would you (or whoever runs training infra at Private AI) be open to a 15-minute call this week? I'd rather answer questions directly than keep pitching over email.

Thanks,
Ivan Stavrikov
SyncSecurity
ivan@sync-security.com · 416-837-1697
