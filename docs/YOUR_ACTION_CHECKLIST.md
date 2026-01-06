# 🚀 Alpha Vision - YOUR ACTION CHECKLIST

> **Everything YOU need to do to make Alpha Vision fully operational**
> The app is built. Now configure these external services.

---

## 📊 SETUP PROGRESS TRACKER

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Create Accounts | 20 min | ☐ |
| 2 | Configure n8n | 30 min | ☐ |
| 3 | Configure Stripe | 15 min | ☐ |
| 4 | Configure GoHighLevel | 10 min | ☐ |
| 5 | Add Secrets to Alpha Vision | 10 min | ☐ |
| 6 | Test Complete Flow | 15 min | ☐ |
| **TOTAL** | | **~2 hours** | |

---

# ⚠️ ARCHITECTURE RULES (IMPORTANT)

**Alpha Vision follows a strict data flow:**

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR BROWSER (Lovable Frontend)                            │
│  ↓ ONLY talks to ↓                                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE (The Brain)                                        │
│  • Database (all your data)                                  │
│  • Edge Functions (all external API calls)                   │
│  • Auth (login/users)                                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  n8n (Your Automation Engine)                                │
│  • Receives approved actions from Supabase                   │
│  • Executes external tool calls                              │
│  • Reports back to Supabase                                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES (via n8n or Make)                         │
│  • GoHighLevel (CRM)                                         │
│  • Stripe (Payments)                                         │
│  • Gmail, Calendar, etc.                                     │
└─────────────────────────────────────────────────────────────┘
```

**❌ NEVER:** Frontend → External APIs directly
**✅ ALWAYS:** Frontend → Supabase → n8n → External APIs

---

# PHASE 1: CREATE ACCOUNTS (20 min)

## ✅ 1.1 n8n Account (REQUIRED)

**Why:** This is the automation engine that executes all your AI-approved actions.

| Step | Action | Done |
|------|--------|------|
| 1 | Go to https://app.n8n.cloud/register | ☐ |
| 2 | Create account (free tier = 2,500 executions/month) | ☐ |
| 3 | Verify email | ☐ |
| 4 | Log in to dashboard | ☐ |

---

## ✅ 1.2 Stripe Account (REQUIRED)

**Why:** Handles all payments and revenue tracking.

| Step | Action | Done |
|------|--------|------|
| 1 | Go to https://dashboard.stripe.com/register | ☐ |
| 2 | Create account | ☐ |
| 3 | Enable **Test Mode** (toggle in top-right) | ☐ |
| 4 | Note: Test keys start with `sk_test_` | ☐ |

---

## ✅ 1.3 GoHighLevel Account (OPTIONAL but recommended)

**Why:** CRM for managing leads, pipelines, automations.

| Step | Action | Done |
|------|--------|------|
| 1 | Go to https://www.gohighlevel.com | ☐ |
| 2 | Start free trial | ☐ |
| 3 | Create a Location (sub-account) | ☐ |

---

# PHASE 2: CONFIGURE n8n (30 min)

## ✅ 2.1 Create Master Executor Workflow

This workflow receives actions from Alpha Vision and executes them.

| Step | Action | Done |
|------|--------|------|
| 1 | In n8n, click "+" → New Workflow | ☐ |
| 2 | Name it: `Alpha Vision Master Executor` | ☐ |
| 3 | Add first node: **Webhook** | ☐ |
| 4 | Set Path: `alpha-vision` | ☐ |
| 5 | Set Response Mode: **"When Last Node Finishes"** | ☐ |
| 6 | Add **Switch** node after Webhook | ☐ |

---

## ✅ 2.2 Configure the Switch Node

Route different action types to different handlers:

```
Switch Mode: Rules
Field to match: {{ $json.type }}

Rule 1: equals "ghl_tag_lead" → Output 0
Rule 2: equals "send_email" → Output 1  
Rule 3: equals "create_invoice" → Output 2
Rule 4: equals "update_crm" → Output 3
Fallback → Output 4
```

---

## ✅ 2.3 Add Callback Node (CRITICAL)

**After EVERY action handler, add this HTTP Request to report back:**

```
Method: POST
URL: https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/tools/callback

Headers:
  Content-Type: application/json
  X-AV-Org-Id: {{ $json.org_id }}
  X-AV-Action-Id: {{ $json.action_id }}
  X-AV-Timestamp: {{ Math.floor(Date.now() / 1000) }}

Body:
{
  "action_id": "{{ $json.action_id }}",
  "status": "succeeded",
  "result": {
    "message": "Completed",
    "data": {{ JSON.stringify($json) }}
  }
}
```

---

## ✅ 2.4 Activate & Copy URL

| Step | Action | Done |
|------|--------|------|
| 1 | Toggle workflow to **Active** | ☐ |
| 2 | Click on Webhook node | ☐ |
| 3 | Copy **Production URL** (NOT Test URL!) | ☐ |
| 4 | Save this URL - you'll add it as a secret | ☐ |

**Your URL looks like:**
```
https://YOUR-INSTANCE.app.n8n.cloud/webhook/alpha-vision
```

---

# PHASE 3: CONFIGURE STRIPE (15 min)

## ✅ 3.1 Get API Keys

| Step | Action | Done |
|------|--------|------|
| 1 | Go to https://dashboard.stripe.com/apikeys | ☐ |
| 2 | Copy **Secret key** (sk_test_xxx or sk_live_xxx) | ☐ |
| 3 | Save securely | ☐ |

---

## ✅ 3.2 Create Webhook Endpoint

| Step | Action | Done |
|------|--------|------|
| 1 | Go to https://dashboard.stripe.com/webhooks | ☐ |
| 2 | Click "Add endpoint" | ☐ |
| 3 | Endpoint URL: | ☐ |

```
https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/webhooks/stripe
```

| 4 | Select these events: | |
|---|----------------------|---|
| | `checkout.session.completed` | ☐ |
| | `invoice.paid` | ☐ |
| | `payment_intent.succeeded` | ☐ |
| | `customer.subscription.created` | ☐ |
| | `customer.subscription.updated` | ☐ |
| | `customer.subscription.deleted` | ☐ |
| 5 | Click "Add endpoint" | ☐ |
| 6 | Click endpoint → Reveal signing secret | ☐ |
| 7 | Copy the `whsec_xxx` value | ☐ |

---

# PHASE 4: CONFIGURE GOHIGHLEVEL (10 min)

## ✅ 4.1 Get API Credentials

| Step | Action | Done |
|------|--------|------|
| 1 | GHL → Settings → Integrations → API Keys | ☐ |
| 2 | Copy API Key | ☐ |
| 3 | Look at URL: `app.gohighlevel.com/location/XXXXX` | ☐ |
| 4 | Copy Location ID (the XXXXX part) | ☐ |

---

## ✅ 4.2 Configure Webhook

| Step | Action | Done |
|------|--------|------|
| 1 | GHL → Settings → Webhooks → Add Webhook | ☐ |
| 2 | URL: | ☐ |

```
https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/webhooks/ghl
```

| 3 | Select events: | |
|---|-----------------|---|
| | Contact Created | ☐ |
| | Contact Updated | ☐ |
| | Opportunity Created | ☐ |
| | Opportunity Stage Changed | ☐ |
| | Appointment Booked | ☐ |
| 4 | Save | ☐ |

---

# PHASE 5: ADD SECRETS TO ALPHA VISION (10 min)

## ✅ 5.1 Generate Webhook Secret

```bash
# Run in terminal to generate a secure secret:
openssl rand -hex 32
```
Copy the 64-character output.

---

## ✅ 5.2 Add All Required Secrets

**Go to Alpha Vision → API Keys page (or ask the AI to add them)**

| Secret Name | Where to Get It | Priority | Done |
|-------------|-----------------|----------|------|
| `N8N_WEBHOOK_URL` | n8n Webhook Production URL | ⭐⭐⭐ CRITICAL | ☐ |
| `N8N_WEBHOOK_SECRET` | Your generated hex string | ⭐⭐⭐ CRITICAL | ☐ |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys | ⭐⭐⭐ CRITICAL | ☐ |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Signing secret | ⭐⭐⭐ CRITICAL | ☐ |
| `GHL_API_KEY` | GHL Settings | ⭐⭐ Recommended | ☐ |
| `GHL_LOCATION_ID` | GHL URL | ⭐⭐ Recommended | ☐ |

---

# PHASE 6: TEST THE COMPLETE FLOW (15 min)

## ✅ 6.1 Test Action Execution

| Step | What to Do | Expected Result | Done |
|------|------------|-----------------|------|
| 1 | Open Alpha Vision → Chat | Chat loads | ☐ |
| 2 | Ask: "Create a test action to tag a lead" | AI proposes action | ☐ |
| 3 | Click "Approve" | Action queued | ☐ |
| 4 | Check n8n Executions tab | Execution appears | ☐ |
| 5 | Check Alpha Vision Approvals | Status = "succeeded" | ☐ |

---

## ✅ 6.2 Test Stripe Webhooks

```bash
# Option A: Use Stripe CLI (recommended)
stripe listen --forward-to https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/webhooks/stripe
stripe trigger payment_intent.succeeded

# Option B: Create test payment in Stripe Dashboard
```

Check Alpha Vision → Revenue to see the payment appear.

---

## ✅ 6.3 Test GHL Webhooks

| Step | Action | Expected | Done |
|------|--------|----------|------|
| 1 | Create a contact in GHL | Contact created | ☐ |
| 2 | Check Alpha Vision → Leads | Lead appears | ☐ |

---

# 🎉 SUCCESS CHECKLIST

When everything is working, you should see:

| Feature | Status |
|---------|--------|
| ✅ Dashboard loads with metrics | |
| ✅ Chat produces AI decisions | |
| ✅ Actions appear in Approvals | |
| ✅ Approved actions execute via n8n | |
| ✅ n8n callbacks update action status | |
| ✅ Stripe payments appear in Revenue | |
| ✅ GHL leads sync to Lead Pipeline | |
| ✅ Real-time updates (no refresh needed) | |

---

# 🆘 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Actions stuck on "queued" | Check N8N_WEBHOOK_URL is the Production URL |
| Callbacks failing | Verify callback URL matches Supabase project URL |
| Stripe webhooks not received | Check endpoint URL and signing secret |
| "Expired" timestamp errors | System clocks out of sync |
| HMAC signature invalid | N8N_WEBHOOK_SECRET must match in both systems |

---

# 📚 OPTIONAL: ADVANCED SETUP

## Google OAuth (for Calendar & Gmail)

| Step | Action | Done |
|------|--------|------|
| 1 | Go to https://console.cloud.google.com | ☐ |
| 2 | Create project | ☐ |
| 3 | Enable: Calendar API, Gmail API | ☐ |
| 4 | Create OAuth 2.0 credentials | ☐ |
| 5 | Add redirect URI: `https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/google-oauth` | ☐ |
| 6 | Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to secrets | ☐ |

---

## Make.com Integration (for external connectors)

| Step | Action | Done |
|------|--------|------|
| 1 | Create Make.com account | ☐ |
| 2 | Create scenario with Webhook trigger | ☐ |
| 3 | Add GHL, other integrations | ☐ |
| 4 | Add callback to Alpha Vision at end | ☐ |

---

## n8n MCP Connection (for direct workflow access)

| Step | Action | Done |
|------|--------|------|
| 1 | n8n → Settings → MCP Access → Enable | ☐ |
| 2 | Copy MCP URL | ☐ |
| 3 | Lovable → Settings → Connectors → n8n | ☐ |
| 4 | Each workflow: Settings → "Available in MCP" = ON | ☐ |

---

# 🔗 QUICK REFERENCE URLs

| Service | URL |
|---------|-----|
| Your Alpha Vision App | (check Lovable dashboard) |
| Supabase Project | `https://unoxusaqjdhcypsqnlsj.supabase.co` |
| n8n Dashboard | https://app.n8n.cloud |
| Stripe Dashboard | https://dashboard.stripe.com |
| GHL Dashboard | https://app.gohighlevel.com |
| Google Cloud Console | https://console.cloud.google.com |

---

# 📋 SECRETS QUICK COPY

For the API Keys page, add these in order:

```
1. N8N_WEBHOOK_URL      → Your n8n Production webhook URL
2. N8N_WEBHOOK_SECRET   → openssl rand -hex 32
3. STRIPE_SECRET_KEY    → sk_test_xxx or sk_live_xxx  
4. STRIPE_WEBHOOK_SECRET → whsec_xxx
5. GHL_API_KEY          → From GHL settings
6. GHL_LOCATION_ID      → From GHL URL
```

---

*Total setup time: ~2 hours*
*Need help? Ask the AI in the chat!*
