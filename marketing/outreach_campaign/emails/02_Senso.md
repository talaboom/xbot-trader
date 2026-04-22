**To:** [recipient@senso.ai]
**From:** ivan@sync-security.com
**Subject:** H200 compute in Mississauga for credit-union fine-tuning — CAD $4/hr bare-metal

---

Hi [Name],

Senso's focus on credit unions caught my eye — financial fine-tuning is one of the narrow workloads where shipping customer documents to a US hyperscaler is a non-starter, full stop. I'm spinning up a small bare-metal GPU node in Mississauga (2x Nvidia H200 NVL, 282 GB HBM3e, Canadian data residency) and I think it lines up well with what you're doing.

Indicative rate: **CAD $4/hr per card, bare-metal, no egress fees, root on the machine.** No shared tenancy, no noisy neighbors.

Why I think it's relevant for Senso specifically:

- **OSFI/FINTRAC-adjacent workloads don't mix well with US clouds.** A Canadian-owned, Canadian-hosted node removes that friction for your credit-union customers.
- **Fine-tuning 70B-class models over long financial documents fits in 282 GB comfortably.** No tensor-parallel gymnastics, no LoRA-only compromises if you need full fine-tune.
- **Hourly billing.** If you do a burst of fine-tuning for a new customer onboarding, you pay for the hours you use — not a reserved-capacity contract.

I'm collecting non-binding Letters of Intent from Toronto-area teams to support an RBC loan application. It's a one-page fillable PDF: estimate GPU-hours/month at the indicative rate, sign, send back. No payment obligation, nothing locked in — it's purely evidence of market demand for my lender.

Happy to walk through the spec sheet or jump on a 15-minute call if it'd help.

Thanks,
Ivan Stavrikov
SyncSecurity
ivan@sync-security.com · 416-837-1697
