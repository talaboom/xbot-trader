# Master Pitch & LOI Source

Single source of truth for all pitch language used across the outreach. Edit here, propagate to emails/DMs/LOI as needed.

---

## One-line pitch

**Bare-metal 2x Nvidia H200 NVL compute (282 GB HBM3e) in Mississauga at CAD $4/hr per card, Canadian data residency, root access, no egress fees.**

---

## Two-sentence elevator pitch

SyncSecurity is building a small bare-metal GPU node in Mississauga — 2x Nvidia H200 NVL (282 GB HBM3e total) — aimed at Toronto-area AI teams and researchers who need large-VRAM compute without US-cloud egress fees or cross-border data-residency friction. Pricing is CAD $4/hr per card, bare-metal with root access, billed hourly.

---

## Full pitch (3 short paragraphs)

Canadian AI teams working with sensitive data — financial records, biomedical documents, industrial telemetry, PII — consistently run into the same friction: the dominant GPU clouds are US-hosted, egress fees are punishing, and data-residency clauses in customer contracts make cross-border training a non-starter. The result is teams either over-paying on reserved cloud instances, compromising on model size to fit in whatever they can get locally, or delaying experiments until cluster slots open up.

SyncSecurity is bringing up a small bare-metal GPU node in Mississauga aimed exactly at this gap: 2x Nvidia H200 NVL (282 GB HBM3e total), Canadian-owned and Canadian-hosted, bare-metal with root, no shared tenancy, no egress fees, billed hourly at CAD $4/hr per card.

This isn't a hyperscaler replacement. It's the "I need an H200 tonight, I need root, my data stays in Canada, and I don't want to sign a reserved-capacity contract" box — useful for fine-tuning bursts, evaluation runs, compiler/kernel experiments, and long-context training on sensitive corpora.

---

## Spec sheet (for follow-up questions)

- **GPUs:** 2x Nvidia H200 NVL
- **HBM3e per card:** 141 GB
- **HBM3e total:** 282 GB
- **Interconnect:** NVLink between cards
- **Host:** bare-metal, root access, no hypervisor tax
- **Location:** Tier-III colo, Mississauga, Ontario, Canada
- **Network:** Canadian data residency, no egress fees on outbound
- **Billing:** hourly, CAD $4 per card per hour (CAD $8/hr for both)
- **Availability target:** [target date — fill in post-funding]
- **Minimum commit:** none — hourly only

---

## Objection handling

**"Why not just use Lambda / Runpod / Vast?"**
Those are great for US-hosted workloads. If your data has to stay in Canada, or if egress fees are non-trivial, or if you need true bare-metal without a hypervisor, the local Mississauga box is the answer.

**"$4/hr — how does that compare?"**
Lambda on-demand H200 is roughly USD $3.29/hr per card (cloud, shared). In CAD that's ~$4.50. We're slightly under that, plus bare-metal, plus Canadian data residency, plus zero egress.

**"Why should I trust you with my data?"**
Bare-metal and root access means you run your own disk encryption, your own network policy, your own everything. I provide hardware and power; you provide the OS image. For compliance-sensitive customers, BYOK disk encryption is standard.

**"What if I need more than 2 cards?"**
This first box is 2x H200 NVL. The loan we're raising funds node #1; LOIs for it help justify scaling to node #2 (4 cards) and node #3 (8 cards) on a 12-month horizon. Multi-node jobs would bridge over a dedicated fibre run.

**"Is this a long-term commit?"**
No. Hourly billing, no contracts, cancel any time. The LOI we're collecting right now is **non-binding** — it is evidence of market intent for our lender, not a purchase order.

---

## LOI collection goals

- **Target:** 4+ signed LOIs before the RBC application deadline
- **Minimum useful ask:** 100 GPU-hours/month at indicative rate
- **Stretch ask:** 250+ GPU-hours/month
- **Pipeline math:** 5 LOIs × 100 hrs × $4 = $2,000/month intent; 10 × 100 × $4 = $4,000/month
- **What counts as "signed":** printed name + date + signature (typed or drawn) on the LOI PDF, emailed back to ivan@sync-security.com
