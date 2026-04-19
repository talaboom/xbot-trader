# SYNCSECURITY AI INTEGRATION — Outreach Campaign

**Purpose:** Collect non-binding Letters of Intent (LOIs) from local AI companies and researchers to strengthen the RBC CSBFL loan application by demonstrating genuine market demand for 2x Nvidia H200 NVL (282GB HBM3e) bare-metal compute at CAD $4/hr in Mississauga.

**Prepared for:** Ivan Stavrikov — ivan@sync-security.com — 416-837-1697
**Date drafted:** April 17, 2026

---

## What's in this folder

```
outreach_campaign/
  README.md                      <- you are here
  emails/                        <- 10 personalized cold emails
    01_PrivateAI.md
    02_Senso.md
    03_BenchSci.md
    04_UntetherAI.md
    05_CentML.md
    06_Cohere.md
    07_CanvassAI.md
    08_Waabi.md
    09_Pitstop.md
    10_UofT_Vector.md
  linkedin/                      <- ready-to-send LinkedIn DMs
    LinkedIn_DMs_H200.md
    Master_Pitch_and_LOI_Source.md
  loi/                           <- Letter of Intent source (render to fillable PDF)
    LOI_SyncSecurity_H200.md
```

---

## The 10 targets (and why each was picked)

| # | Company | Why they might care |
|---|---------|---------------------|
| 1 | Private AI (Toronto) | PII-redaction models — Canadian data residency matters |
| 2 | Senso.ai (Toronto) | Fine-tuning on financial docs for credit unions |
| 3 | BenchSci (Toronto) | Biomedical LLMs — long context, big VRAM |
| 4 | Untether AI (Toronto) | Inference benchmarking, model-porting experiments |
| 5 | CentML (Toronto / UofT) | Compiler / kernel optimization research workloads |
| 6 | Cohere (Toronto) | Side / out-of-band experimentation without IT tickets |
| 7 | Canvass AI (Toronto) | Industrial time-series training with gnarly sensor data |
| 8 | Waabi (Toronto) | Simulation burst compute for autonomy training |
| 9 | Pitstop (Mississauga) | Fleet predictive maintenance — local, zero egress |
| 10 | UofT / Vector researchers | Grant-friendly hourly billing, no queue |

---

## How to send (recommended sequence)

### Step 1 — Find a real recipient at each company

Each email has a `[recipient@company.com]` placeholder in the "To:" line. Before sending, replace it with an actual person. Best options:

- **LinkedIn** — search "AI engineer", "ML lead", "head of ML" at each company
- **Company website** — many list team members with email conventions (firstname@company.com)
- **GitHub** — for Cohere / Untether / Private AI, look at the most active public-facing engineer
- **UofT/Vector** — pick 2–3 PhD students whose thesis topic fits; the Vector website has a researcher directory

### Step 2 — Personalize the [Name] tag

Open each `.md` file, replace `[Name]` with the first name of your recipient, and replace the `[recipient@…]` with their real address.

### Step 3 — Paste into Gmail (ivan@sync-security.com)

For each email:

1. Compose a new message in Gmail (logged in as **ivan@sync-security.com**, NOT ivstavrikov@gmail.com — the whole point is to look professional)
2. Copy the **Subject** line from the `.md` file
3. Copy the body (everything under the `---` separator, starting at "Hi [Name],")
4. Attach `loi/LOI_SyncSecurity_H200.pdf` to any email where you explicitly offer an LOI (all of them do)
5. Send

### Step 4 — Send LinkedIn DMs as a parallel channel

Open `linkedin/LinkedIn_DMs_H200.md` — each message is already short-form, DM-sized, and targeted at a specific person/team. Copy-paste straight into LinkedIn DM.

### Step 5 — Track replies

Set a simple Gmail label ("H200 outreach" → "replied" / "interested" / "cold"). Forward any "yes" responses to Mohammad Assaad at RBC as they come in — live evidence of demand is the strongest attachment you can send with the loan package.

---

## Sending cadence

To avoid Gmail flagging you as a bulk sender on a brand-new domain:

- **Day 1 (today):** Send 3 emails — pick the 3 you feel most confident about
- **Day 2:** Send 3 more
- **Day 3:** Send the final 4
- **In parallel:** Send 2–3 LinkedIn DMs per day

Total campaign should wrap in under a week.

---

## The LOI PDF

`loi/LOI_SyncSecurity_H200.md` is the source copy — render to a fillable PDF so recipients can open in Adobe Reader, Preview (Mac), or most modern browsers and type directly into the fields:

- Date
- Company / Institution
- Contact name, title, email, phone
- Estimated GPU-hours per month
- Signature, date, printed name, title

They save and email it back to you. You collect, bundle into a single PDF (pypdf / Adobe / Preview), and attach to the RBC loan package as "Evidence of Market Demand."

**Key talking point for the LOI attachment:** it is **non-binding** — this is explicitly stated in the document. Recipients have nothing to lose by signing, which dramatically improves conversion rates.

---

## What to tell RBC (Mohammad Assaad) about this

When Mohammad asks about market demand / pre-sales (he will), you can now answer:

> I've run a targeted outreach to 10 Toronto-area AI companies and research groups who are the natural customers for this compute node. I've attached signed Letters of Intent from [X] of them representing approximately [Y] GPU-hours per month of non-binding reserved interest at our indicative rate — which corresponds to roughly CAD $[Z] per month of committed revenue pipeline before the hardware is even online.

The math to keep in your head:

- 1 signed LOI for 100 hrs/month × $4 = **$400/month** revenue intent
- 5 signed LOIs × ~100 hrs = **$2,000/month** pipeline
- 10 signed LOIs × ~100 hrs = **$4,000/month** pipeline

Even 3–4 solid LOIs materially strengthens the debt-service coverage story.

---

## Quick checklist before you hit send on Email #1

- [ ] ivan@sync-security.com is set up in Gmail and verified (SPF/DKIM/DMARC in Google Workspace admin)
- [ ] Gmail signature is configured with your name, title, email, phone
- [ ] You've swapped the `[recipient@...]` and `[Name]` placeholders
- [ ] `LOI_SyncSecurity_H200.pdf` is attached
- [ ] Subject line is intact (do not edit — they're written to survive spam filters on a new domain)

---

## If someone says yes

Template reply:

> Thanks [Name], really appreciate it. Attached is the LOI — it's fillable, so you can complete the fields right in your PDF viewer, add a signature (typed or drawn is fine for a non-binding LOI), and send it back. No rush, any time this week is great.
>
> Happy to answer any questions about the hardware, timeline, or commercial terms before you sign.
>
> Ivan

## If someone says no / not interested

Template reply:

> Totally understood — thanks for the quick read. If your needs change or you know someone in the Toronto AI community who could use affordable local H200 time, I'd appreciate a forward.
>
> Ivan
