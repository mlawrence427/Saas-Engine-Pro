This is the minimum viable runbook for running SaaS Engine Pro safely.

You do not need anything bigger than this for Phase 1.

1️⃣ DAILY (1–2 minutes)

 Open Stripe dashboard

 Check:

Payments succeeded

No webhook failures

 Open app → confirm:

You can log in

A CORE and POWER user still resolve correct access

That’s it. No over-monitoring.

2️⃣ IF A USER REPORTS “MY PLAN IS WRONG”

Order of operations (always the same):

Tell them to click “Fix My Plan” (your /billing/sync)

If still wrong:

Go to Stripe → find their customer

Confirm active subscription + price ID

Re-send the latest Stripe webhook event

If still wrong:

Manually fix User.plan in DB

Log action in audit table (or note it)

✅ 99% of all billing issues die here.

3️⃣ IF A USER CAN’T ACCESS A FEATURE

Check:

User.plan

ModuleAccess

Any active overrides

If override exists:

Check expiresAt

If needed:

Grant temporary override

Set expiration

Tell user access will auto-correct after expiry if appropriate

4️⃣ IF STRIPE WEBHOOKS FAIL

Stripe Dashboard → Developers → Webhooks

Re-send failed event

Watch your webhook logs

Confirm:

ProcessedWebhookEvent updated

User.plan reconciled

5️⃣ IF YOU SHIP A BAD DEPLOY

Roll back to previous commit

Re-deploy

Verify:

Login works

Billing routes respond

Gating still blocks correctly

6️⃣ YOUR SUPPORT BOUNDARIES (NON-NEGOTIABLE)

✅ Async only

✅ 24–72 hour response window

✅ No phone, no Discord, no Slack

✅ No custom installs in Phase 1

This protects your solo sanity.

7️⃣ PHASE 1 “DO NOT TOUCH” LIST

During Phase 1, you do not add:

❌ Enterprise SSO

❌ Multi-org hierarchy

❌ Custom pricing

❌ White-labeling

❌ On-call alerts

These are Phase 2+ pressure multipliers.