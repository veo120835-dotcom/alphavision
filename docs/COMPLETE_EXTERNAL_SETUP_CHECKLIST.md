# 📋 Alpha Vision - Complete External Setup Checklist

> **Everything you need to do OUTSIDE of Lovable to make the system fully operational**
> Estimated Total Time: 2-3 hours

---

## 🎯 Overview

Alpha Vision is built and deployed. Now you need to:
1. Create external accounts
2. Configure webhooks in each platform
3. Add API keys/secrets to Alpha Vision
4. Test the complete flow

---

# PHASE 1: ACCOUNTS & ACCESS (30 min)

## ✅ 1.1 Create n8n Account

**Priority:** ⭐⭐⭐ CRITICAL - Nothing works without this

| Step | Action | Done |
|------|--------|------|
| 1 | Go to https://app.n8n.cloud/register | ☐ |
| 2 | Click "Start free trial" | ☐ |
| 3 | Enter email + password | ☐ |
| 4 | Verify email (check inbox) | ☐ |
| 5 | Log in to n8n dashboard | ☐ |

**Free tier includes:** 2,500 executions/month - enough to start!

---

## ✅ 1.2 Create Stripe Account

**Priority:** ⭐⭐⭐ CRITICAL - Required for payments

| Step | Action | Done |
|------|--------|------|
| 1 | Go to https://dashboard.stripe.com/register | ☐ |
| 2 | Create account with email | ☐ |
| 3 | Verify email | ☐ |
| 4 | Complete business profile (can skip for testing) | ☐ |
| 5 | Enable "Test Mode" (toggle in dashboard) | ☐ |

**Use Test Mode first!** Test keys start with `sk_test_`

---

## ✅ 1.3 GoHighLevel Account (Optional)

**Priority:** ⭐⭐ RECOMMENDED - For CRM/lead management

| Step | Action | Done |
|------|--------|------|
| 1 | Go to https://www.gohighlevel.com | ☐ |
| 2 | Start free trial or use existing account | ☐ |
| 3 | Create/select a Location (sub-account) | ☐ |
| 4 | Note your Location ID from the URL | ☐ |

---

## ✅ 1.4 Other Accounts (Optional - For Lead Enrichment)

| Service | URL | Purpose | Done |
|---------|-----|---------|------|
| Exa.ai | https://exa.ai | Neural search | ☐ |
| Hunter.io | https://hunter.io | Email finder | ☐ |
| Apollo.io | https://apollo.io | B2B database | ☐ |
| Google Cloud | https://console.cloud.google.com | Calendar/Gmail | ☐ |

---

# PHASE 2: N8N WORKFLOW SETUP (45 min)

## ✅ 2.1 Create Master Executor Workflow

| Step | Action | Done |
|------|--------|------|
| 1 | In n8n, click "+" to create new workflow | ☐ |
| 2 | Name it: "Alpha Vision Master Executor" | ☐ |
| 3 | Add first node: **Webhook** | ☐ |
| 4 | Configure webhook: Method = POST, Path = `alpha-vision` | ☐ |
| 5 | **IMPORTANT**: Set Response Mode = "When Last Node Finishes" | ☐ |

---

## ✅ 2.2 Add Switch Node (Route by Action Type)

| Step | Action | Done |
|------|--------|------|
| 1 | Add **Switch** node after Webhook | ☐ |
| 2 | Set Mode = "Rules" | ☐ |
| 3 | Add rules for each action type: | |
|   | Rule 1: `{{ $json.type }}` equals `ghl_tag_lead` → Output 0 | ☐ |
|   | Rule 2: `{{ $json.type }}` equals `send_email` → Output 1 | ☐ |
|   | Rule 3: `{{ $json.type }}` equals `create_invoice` → Output 2 | ☐ |
|   | Fallback → Output 3 | ☐ |

---

## ✅ 2.3 Add Action Handlers

### For GHL Actions (Output 0):
| Step | Action | Done |
|------|--------|------|
| 1 | Add **HTTP Request** node | ☐ |
| 2 | Method: POST | ☐ |
| 3 | URL: `https://rest.gohighlevel.com/v1/contacts/{{ $json.payload.contact_id }}/tags` | ☐ |
| 4 | Add Header: `Authorization: Bearer {{ $credentials.ghlApiKey }}` | ☐ |
| 5 | Body: `{ "tags": ["{{ $json.payload.tag }}"] }` | ☐ |

### For Email Actions (Output 1):
| Step | Action | Done |
|------|--------|------|
| 1 | Add **Gmail** or **Send Email** node | ☐ |
| 2 | Configure your email credentials | ☐ |
| 3 | Use `{{ $json.payload.to }}` for recipient | ☐ |
| 4 | Use `{{ $json.payload.subject }}` for subject | ☐ |
| 5 | Use `{{ $json.payload.body }}` for content | ☐ |

### For Stripe Actions (Output 2):
| Step | Action | Done |
|------|--------|------|
| 1 | Add **Stripe** node | ☐ |
| 2 | Connect your Stripe account | ☐ |
| 3 | Operation: Create Invoice | ☐ |
| 4 | Customer: `{{ $json.payload.customer_id }}` | ☐ |

### For Fallback (Output 3):
| Step | Action | Done |
|------|--------|------|
| 1 | Add **Set** node | ☐ |
| 2 | Add field: `error` = "Unknown action type" | ☐ |

---

## ✅ 2.4 Add Callback to Alpha Vision

**This is CRITICAL - tells Alpha Vision when actions complete**

| Step | Action | Done |
|------|--------|------|
| 1 | After EACH handler, add **HTTP Request** node | ☐ |
| 2 | Method: POST | ☐ |
| 3 | URL: `https://wqdflwqepedqgbcwqqq.supabase.co/functions/v1/webhooks/v1/tools/callback` | ☐ |
| 4 | Add Headers: | |
|   | `Content-Type`: `application/json` | ☐ |
|   | `X-AV-Org-Id`: `{{ $json.org_id }}` | ☐ |
|   | `X-AV-Action-Id`: `{{ $json.action_id }}` | ☐ |
|   | `X-AV-Timestamp`: `{{ Math.floor(Date.now() / 1000) }}` | ☐ |
|   | `X-AV-Nonce`: `{{ $randomUUID }}` | ☐ |
| 5 | Body: | ☐ |
```json
{
  "action_id": "{{ $json.action_id }}",
  "status": "succeeded",
  "result": {
    "message": "Action completed",
    "data": {{ JSON.stringify($json) }}
  }
}
```

---

## ✅ 2.5 Activate Workflow & Get URL

| Step | Action | Done |
|------|--------|------|
| 1 | Click the **"Inactive"** toggle → set to **Active** | ☐ |
| 2 | Click on the Webhook node | ☐ |
| 3 | Find **"Production URL"** (NOT Test URL!) | ☐ |
| 4 | Copy this URL - you'll need it for the next phase | ☐ |

**Your URL looks like:** `https://YOUR-INSTANCE.app.n8n.cloud/webhook/alpha-vision`

---

# PHASE 3: STRIPE CONFIGURATION (20 min)

## ✅ 3.1 Get API Keys

| Step | Action | Done |
|------|--------|------|
| 1 | Go to https://dashboard.stripe.com/apikeys | ☐ |
| 2 | Copy **Secret key** (starts with `sk_test_` or `sk_live_`) | ☐ |
| 3 | Save it securely - you'll add it to Alpha Vision | ☐ |

---

## ✅ 3.2 Create Webhook Endpoint

| Step | Action | Done |
|------|--------|------|
| 1 | Go to https://dashboard.stripe.com/webhooks | ☐ |
| 2 | Click "Add endpoint" | ☐ |
| 3 | Endpoint URL: `https://wqdflwqepedqgbcwqqq.supabase.co/functions/v1/webhooks/v1/webhooks/stripe` | ☐ |
| 4 | Select events to listen to: | |
|   | ☐ `invoice.paid` | ☐ |
|   | ☐ `checkout.session.completed` | ☐ |
|   | ☐ `customer.subscription.created` | ☐ |
|   | ☐ `customer.subscription.updated` | ☐ |
|   | ☐ `customer.subscription.deleted` | ☐ |
|   | ☐ `payment_intent.succeeded` | ☐ |
| 5 | Click "Add endpoint" | ☐ |
| 6 | Click on the endpoint to view details | ☐ |
| 7 | Find "Signing secret" → Click "Reveal" | ☐ |
| 8 | Copy the `whsec_...` value | ☐ |

---

## ✅ 3.3 Test with Stripe CLI (Optional but Recommended)

| Step | Action | Done |
|------|--------|------|
| 1 | Install Stripe CLI: https://stripe.com/docs/stripe-cli | ☐ |
| 2 | Run: `stripe login` | ☐ |
| 3 | Run: `stripe listen --forward-to https://wqdflwqepedqgbcwqqq.supabase.co/functions/v1/webhooks/v1/webhooks/stripe` | ☐ |
| 4 | In another terminal: `stripe trigger payment_intent.succeeded` | ☐ |
| 5 | Verify webhook received in Alpha Vision logs | ☐ |

---

# PHASE 4: GOHIGHLEVEL CONFIGURATION (15 min)

## ✅ 4.1 Get API Key

| Step | Action | Done |
|------|--------|------|
| 1 | Log into GHL | ☐ |
| 2 | Go to Settings → Integrations → API Keys | ☐ |
| 3 | Create new API key (or use existing) | ☐ |
| 4 | Copy the API key | ☐ |

---

## ✅ 4.2 Get Location ID

| Step | Action | Done |
|------|--------|------|
| 1 | Go to your Location (sub-account) | ☐ |
| 2 | Look at the URL: `app.gohighlevel.com/location/XXXXXXXX` | ☐ |
| 3 | Copy the XXXXXXXX part - this is your Location ID | ☐ |

---

## ✅ 4.3 Configure Webhooks in GHL

| Step | Action | Done |
|------|--------|------|
| 1 | Go to Settings → Webhooks | ☐ |
| 2 | Click "Add Webhook" | ☐ |
| 3 | URL: `https://wqdflwqepedqgbcwqqq.supabase.co/functions/v1/webhooks/v1/webhooks/ghl` | ☐ |
| 4 | Select events: | |
|   | ☐ Contact Created | ☐ |
|   | ☐ Contact Updated | ☐ |
|   | ☐ Opportunity Created | ☐ |
|   | ☐ Opportunity Stage Changed | ☐ |
|   | ☐ Opportunity Won | ☐ |
|   | ☐ Opportunity Lost | ☐ |
|   | ☐ Appointment Booked | ☐ |
|   | ☐ Form Submitted | ☐ |
| 5 | Click "Save" | ☐ |

---

# PHASE 5: ADD SECRETS TO ALPHA VISION (15 min)

## ✅ 5.1 Generate Webhook Secret

| Step | Action | Done |
|------|--------|------|
| 1 | Open terminal/command prompt | ☐ |
| 2 | Run: `openssl rand -hex 32` | ☐ |
| 3 | Copy the output (64 character string) | ☐ |
| 4 | **Also add this same secret to your n8n workflow** for HMAC verification | ☐ |

---

## ✅ 5.2 Add All Secrets

Go to Alpha Vision → API Keys page and add:

| Secret Name | Value Source | Priority | Done |
|-------------|--------------|----------|------|
| `N8N_WEBHOOK_URL` | n8n Webhook Production URL | ⭐⭐⭐ | ☐ |
| `N8N_WEBHOOK_SECRET` | Generated hex string | ⭐⭐⭐ | ☐ |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | ⭐⭐⭐ | ☐ |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook signing secret | ⭐⭐⭐ | ☐ |
| `GHL_API_KEY` | GHL Settings | ⭐⭐ | ☐ |
| `GHL_LOCATION_ID` | GHL URL | ⭐⭐ | ☐ |
| `EXA_API_KEY` | Exa.ai Dashboard | ⭐ | ☐ |
| `HUNTER_API_KEY` | Hunter.io Account | ⭐ | ☐ |
| `APOLLO_API_KEY` | Apollo.io Account | ⭐ | ☐ |
| `GOOGLE_CLIENT_ID` | Google Cloud Console | ⭐ | ☐ |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | ⭐ | ☐ |

---

# PHASE 6: TEST THE COMPLETE FLOW (15 min)

## ✅ 6.1 Test Chat → Action → Execution

| Step | Action | Expected Result | Done |
|------|--------|-----------------|------|
| 1 | Open Alpha Vision | Dashboard loads | ☐ |
| 2 | Go to Chat | Chat interface opens | ☐ |
| 3 | Type: "Create a test action to tag a lead with 'test'" | AI responds with proposed action | ☐ |
| 4 | Click "Approve" on the action | Action status changes to "queued" | ☐ |
| 5 | Check n8n Executions | Execution appears | ☐ |
| 6 | Check Alpha Vision Approvals | Action status = "succeeded" | ☐ |

---

## ✅ 6.2 Test Stripe → Revenue Tracking

| Step | Action | Expected Result | Done |
|------|--------|-----------------|------|
| 1 | Create a test payment in Stripe | Payment succeeds | ☐ |
| 2 | Check Alpha Vision Revenue dashboard | Payment appears | ☐ |
| 3 | Verify real-time update | UI updates without refresh | ☐ |

---

## ✅ 6.3 Test GHL → Lead Sync

| Step | Action | Expected Result | Done |
|------|--------|-----------------|------|
| 1 | Create a contact in GHL | Contact created | ☐ |
| 2 | Check Alpha Vision Leads page | Lead appears | ☐ |
| 3 | Verify data matches | Name, email correct | ☐ |

---

# PHASE 7: OPTIONAL ENHANCEMENTS

## ✅ 7.1 Google OAuth Setup (For Calendar & Gmail)

| Step | Action | Done |
|------|--------|------|
| 1 | Go to https://console.cloud.google.com | ☐ |
| 2 | Create new project or select existing | ☐ |
| 3 | Enable APIs: Calendar API, Gmail API | ☐ |
| 4 | Go to APIs & Services → Credentials | ☐ |
| 5 | Create OAuth 2.0 Client ID | ☐ |
| 6 | Add authorized redirect URI: `https://wqdflwqepedqgbcwqqq.supabase.co/functions/v1/google-oauth` | ☐ |
| 7 | Copy Client ID and Client Secret | ☐ |
| 8 | Add to Alpha Vision secrets | ☐ |

---

## ✅ 7.2 Connect n8n via MCP (Advanced)

| Step | Action | Done |
|------|--------|------|
| 1 | In n8n: Settings → MCP Access | ☐ |
| 2 | Enable MCP access | ☐ |
| 3 | Copy the MCP URL | ☐ |
| 4 | In Lovable: Settings → Connectors → n8n | ☐ |
| 5 | Paste MCP URL and connect | ☐ |
| 6 | In n8n: Open each workflow → Settings → Enable "Available in MCP" | ☐ |

---

## ✅ 7.3 Set Up Additional n8n Workflows

| Workflow | Purpose | Done |
|----------|---------|------|
| Lead Enrichment | Auto-enrich new leads with company data | ☐ |
| Daily Digest | Send daily email summary of metrics | ☐ |
| Slack Notifications | Alert on high-value actions | ☐ |
| Calendar Sync | Create calendar events for calls | ☐ |
| Invoice Generator | Auto-create Stripe invoices | ☐ |

---

# 📊 FINAL VERIFICATION CHECKLIST

Run through this to confirm everything works:

| Test | Expected Behavior | Pass |
|------|-------------------|------|
| Dashboard loads | Shows setup checklist, metrics | ☐ |
| Chat works | AI responds with structured decisions | ☐ |
| Actions appear | Proposed actions show in Approvals | ☐ |
| Approval executes | Action runs via n8n | ☐ |
| Callback received | Action status updates to succeeded | ☐ |
| Stripe webhook works | Payments appear in Revenue | ☐ |
| GHL webhook works | Leads sync automatically | ☐ |
| Real-time updates | UI updates without refresh | ☐ |

---

# 🎉 CONGRATULATIONS!

If all tests pass, your Alpha Vision system is fully operational:

✅ AI-powered business advisor
✅ Automated action execution via n8n
✅ Payment tracking via Stripe
✅ CRM integration via GoHighLevel
✅ Real-time dashboard updates
✅ Security (HMAC, Stripe signatures)

---

# 🆘 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Actions not executing | Check N8N_WEBHOOK_URL is correct (Production, not Test) |
| Callbacks failing | Verify callback URL in n8n matches Supabase URL |
| Stripe webhooks not received | Check webhook endpoint URL, verify signing secret |
| GHL leads not syncing | Confirm GHL webhook URL and selected events |
| "Expired" errors | System clocks may be out of sync (timestamp > 5 min old) |
| HMAC signature errors | Ensure N8N_WEBHOOK_SECRET matches in both systems |

---

*Need help? Check the docs folder or ask in the chat!*
