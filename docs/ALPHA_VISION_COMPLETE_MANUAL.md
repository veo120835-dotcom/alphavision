# 🚀 Alpha Vision - Complete Setup & Operations Manual

> **Version:** 1.1.0 | **Last Updated:** January 2026  
> **Difficulty:** Beginner-Friendly | **Time to Setup:** 2-4 hours
>
> **Alpha Vision** is your **AI-powered autonomous business partner** — strategy, growth, operations, and financial planning in one intelligent system.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [What's Implemented vs Missing](#whats-implemented-vs-missing)
3. [Architecture Diagram](#architecture-diagram)
4. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
5. [n8n Integration Guide](#n8n-integration-guide)
6. [GoHighLevel Setup](#gohighlevel-setup)
7. [Stripe Integration](#stripe-integration)
8. [Testing Your Setup](#testing-your-setup)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Overview

Alpha Vision is an AI-powered autonomous business agent that:

- **Advises** on business decisions with risk-weighted recommendations
- **Operates** by executing approved actions via n8n workflows
- **Runs on Autopilot** for pre-approved action types within policy caps

### Core Modules

| Module | Status | Description |
|--------|--------|-------------|
| Chat/Advisor Engine | ✅ Complete | AI chat with structured decision output |
| Permission Contract | ✅ Complete | Risk posture + spending caps |
| Action Approval System | ✅ Complete | Approve/deny proposed actions |
| Decision Log | ✅ Complete | Audit trail of all recommendations |
| ROI Attribution Engine | ✅ UI Only | Tracks decision→outcome chains |
| Async Closing Engine | ✅ UI Only | Generates sales rooms |
| Lead Exchange | ✅ UI Only | Marketplace for leads |
| Licensing System | ✅ UI Only | White-label multi-tenant |
| n8n Bridge | ⚠️ Partial | Needs n8n workflow setup |
| Stripe Billing | ⚠️ Partial | Webhook ready, needs key |
| GoHighLevel | ⚠️ Partial | Webhook ready, needs setup |
| Real-time Events | ✅ Complete | WebSocket broadcasts |

---

## ❌ What's Implemented vs ⚠️ Missing

### ✅ FULLY IMPLEMENTED

1. **Database Schema** - 47+ tables for all features
2. **Unified API** (`/v1/*`) - Sessions, Chat, Policy, Actions, Decisions
3. **Webhook Handlers** - Stripe, GHL, n8n callbacks
4. **Real-time Events** - Supabase channels for live updates
5. **AI Integration** - Lovable AI gateway (free, no API key needed)
6. **Frontend Components** - 60+ React components
7. **Type-safe API Client** - `src/lib/api-client.ts`

### ⚠️ NEEDS YOUR ACTION

| Item | What You Need to Do |
|------|---------------------|
| **n8n Workflows** | Create workflows in n8n (free cloud tier available) |
| **N8N_WEBHOOK_URL** | Add as Cloud secret |
| **Stripe Key** | Connect via Stripe connector or add secret |
| **GoHighLevel API** | Get API key from GHL, configure webhooks |
| **Authentication Flow** | Test signup/login |
| **First Organization** | Create org + business config |

### 🔴 NOT YET BUILT (Future Roadmap)

1. **HMAC Signature Verification** - Currently headers only, no crypto verify
2. **Outcome Billing Auto-Invoice** - Manual invoicing only
3. **Playbook Marketplace** - DB ready, no purchase flow
4. **Lead Exchange Transactions** - No payment processing
5. **Certification Badge Generation** - No badge images
6. **Multi-tenant Isolation** - Partial (RLS in place)

---

## 🏛️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ALPHA VISION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Frontend   │───▶│  Supabase    │───▶│    n8n       │       │
│  │   (React)    │◀───│  Edge Funcs  │◀───│  Workflows   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Supabase   │    │   Lovable    │    │    GHL       │       │
│  │   Realtime   │    │   AI API     │    │   Stripe     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User sends message → Chat UI
2. Chat UI → POST /v1/chat/send → Unified API Edge Function
3. Edge Function → Lovable AI → Structured JSON response
4. Response → Stored in DB (messages, decisions, actions)
5. If action.requires_approval → Show in Approvals UI
6. User approves → POST /v1/actions/{id}/approve
7. Edge Function → POST to n8n webhook
8. n8n executes workflow → Calls GHL/Stripe/Email/etc
9. n8n → POST /v1/tools/callback → Updates action status
10. Supabase Realtime → Broadcasts to UI
```

---

## 🛠️ Step-by-Step Setup Guide

### Step 1: Access Your App

Your app is already running! The following are pre-configured:
- ✅ Supabase database with all tables
- ✅ Edge functions deployed
- ✅ Lovable AI API key (automatic)
- ✅ Authentication system

### Step 2: Create Your First Account

1. Click "Sign Up" on the login page
2. Enter email and password
3. You'll be automatically logged in (auto-confirm enabled)

### Step 3: Create Organization

After signup, you need an organization. Run this in your browser console (or we'll add UI):

```javascript
// This happens automatically when you first use the chat
```

Or use the Settings page to configure your business.

### Step 4: Configure Business Settings

Go to **Settings** → **Business Config**:

- Product Name
- Base Price
- Booking Link
- Brand Voice
- System Persona

---

## 🔧 n8n Integration Guide

n8n is the "nervous system" that executes actions. Here's how to set it up:

### Option A: n8n Cloud (Recommended for Beginners)

1. **Sign up for free** at [n8n.cloud](https://n8n.cloud)
2. You get 5 workflows free forever

### Option B: Self-Host n8n (Free, More Work)

```bash
# Using Docker
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### Creating Your First Workflow

#### Workflow 1: "Alpha Vision Action Executor"

This workflow receives all action requests from Alpha Vision.

**Step-by-Step:**

1. **Create New Workflow** → Name it "Alpha Vision Executor"

2. **Add Webhook Trigger Node:**
   ```
   Node Type: Webhook
   HTTP Method: POST
   Path: tools/execute
   Response Mode: Immediately
   ```
   
   Copy the **Production URL** - you'll need this!

3. **Add Switch Node** (to route by action type):
   ```
   Node Type: Switch
   Property: body.type
   
   Rules:
   - "ghl_tag_lead" → GHL Branch
   - "send_email" → Email Branch
   - "log_event" → Logger Branch
   ```

4. **Add HTTP Request Node** (for callback):
   ```
   Node Type: HTTP Request
   Method: POST
   URL: https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/tools/callback
   
   Headers:
   - X-AV-Org-Id: {{ $json.body.org_id }}
   - X-AV-Action-Id: {{ $json.body.action_id }}
   - X-AV-Timestamp: {{ Date.now() / 1000 }}
   - X-AV-Nonce: {{ $randomString }}
   
   Body (JSON):
   {
     "action_id": "{{ $json.body.action_id }}",
     "status": "succeeded",
     "result": { "message": "Action completed" }
   }
   ```

5. **Activate the Workflow** (toggle on)

6. **Copy the Webhook URL** - it looks like:
   ```
   https://your-instance.app.n8n.cloud/webhook/abc123/tools/execute
   ```

### Adding the n8n URL to Alpha Vision

1. Go to **Project Settings** → **Secrets**
2. Add new secret:
   - Name: `N8N_WEBHOOK_URL`
   - Value: Your n8n webhook URL

Or I can add it for you - just paste your webhook URL!

### Example Workflow: Tag Lead in GoHighLevel

```
[Webhook Trigger]
      ↓
[Switch: type === "ghl_tag_lead"]
      ↓
[HTTP Request: GHL API]
  POST https://rest.gohighlevel.com/v1/contacts/{contactId}/tags
  Headers: Authorization: Bearer {{GHL_API_KEY}}
  Body: { "tags": ["{{ $json.body.payload.tag }}"] }
      ↓
[HTTP Request: Callback to Alpha Vision]
  POST .../v1/tools/callback
  Body: { "status": "succeeded", ... }
```

### n8n Workflow Templates

Here are the essential workflows to create:

| Workflow Name | Trigger | Actions |
|--------------|---------|---------|
| Tag Lead | ghl_tag_lead | GHL API → Tag contact |
| Send Email | send_email_sequence | GHL/Sendgrid → Send email |
| Create Opportunity | ghl_create_opportunity | GHL API → Create opportunity |
| Update Pipeline | ghl_update_stage | GHL API → Move opportunity |
| Send Slack Alert | send_slack_alert | Slack API → Post message |
| Log to Sheet | log_to_sheets | Google Sheets → Append row |

---

## 📱 GoHighLevel Setup

### Step 1: Get Your GHL API Key

1. Log into GoHighLevel
2. Go to **Settings** → **API Keys** (or use the Marketplace)
3. Create new API key with these scopes:
   - contacts.readonly
   - contacts.write
   - opportunities.readonly
   - opportunities.write
   - locations.readonly

### Step 2: Configure GHL Webhooks

In GHL, go to **Automations** → **Webhooks**:

1. **Lead Created Webhook:**
   ```
   URL: https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/webhooks/ghl
   Event: Contact Created
   ```

2. **Opportunity Won Webhook:**
   ```
   URL: https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/webhooks/ghl
   Event: Opportunity Status Changed (filter: won)
   ```

3. **Appointment Booked Webhook:**
   ```
   URL: https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/webhooks/ghl
   Event: Appointment Booked
   ```

### Step 3: Add GHL to n8n

In your n8n workflows, add GHL credentials:

1. Go to **Credentials** → **New**
2. Select **GoHighLevel API**
3. Enter your API key

Now your n8n workflows can call GHL!

---

## 💳 Stripe Integration

### Step 1: Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your **Secret Key** (starts with `sk_`)
3. Get your **Publishable Key** (starts with `pk_`)

### Step 2: Configure Stripe Webhook

In Stripe Dashboard → **Webhooks**:

1. Add endpoint:
   ```
   URL: https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/webhooks/stripe
   ```

2. Select events:
   - `invoice.paid`
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`

3. Copy the **Webhook Signing Secret** (starts with `whsec_`)

### Step 3: Add Stripe Keys

Add these secrets to your project:
- `STRIPE_SECRET_KEY` - Your secret key
- `STRIPE_WEBHOOK_SECRET` - The signing secret

---

## 🧪 Testing Your Setup

### Test 1: Chat Works

1. Go to **Chat** in the sidebar
2. Type: "What's the best way to increase my prices by 20%?"
3. You should get a structured response with:
   - Decision
   - Why This Wins
   - Options A/B/C
   - Next Actions

### Test 2: n8n Connection

1. In Chat, type: "Send a test Slack message"
2. Check if an action appears in **Approvals**
3. Approve the action
4. Check n8n execution history

### Test 3: GHL Webhook

1. Create a test contact in GHL
2. Check **Leads** in Alpha Vision - should appear
3. Check Supabase logs for webhook receipt

### Test 4: Real-time Updates

1. Open two browser tabs
2. Approve an action in one tab
3. Other tab should update automatically

---

## 🔥 Troubleshooting

### "No organization found"

You need to create an organization first. The app should do this automatically on first login, but if not:

1. Check if you're logged in
2. Try logging out and back in
3. Contact support if issue persists

### "n8n webhook not triggering"

1. Check that `N8N_WEBHOOK_URL` secret is set
2. Verify the n8n workflow is **activated** (toggle ON)
3. Check n8n execution history for errors
4. Verify the URL is the production URL, not test URL

### "GHL webhook not working"

1. Verify the webhook URL is correct
2. Check that the event type matches
3. Look at Edge Function logs in Supabase
4. Ensure GHL location ID matches org_id

### "Stripe payments not tracking"

1. Verify webhook is correctly configured
2. Check Stripe webhook logs for delivery status
3. Ensure `org_id` is in payment metadata
4. Check Supabase `billing_events` table

### "AI responses are empty"

The Lovable AI API is pre-configured. If issues:
1. Check Edge Function logs
2. Verify the response format
3. Try a simpler message

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Decision Volume** - How many decisions per day
2. **Approval Rate** - % of actions approved
3. **Execution Success** - % of n8n workflows succeeding
4. **Revenue Attribution** - Money influenced by AI

### Viewing Logs

1. **Edge Function Logs:** Check Supabase dashboard
2. **n8n Execution History:** Check n8n dashboard
3. **Real-time Events:** Check browser console

---

## 🎯 Quick Reference: API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/sessions` | POST | Create chat session |
| `/v1/sessions/{id}` | GET | Get session + messages |
| `/v1/chat/send` | POST | Send message, get AI response |
| `/v1/policy` | GET | Get permission contract |
| `/v1/policy` | PUT | Update policy (admin) |
| `/v1/actions` | GET | List actions |
| `/v1/actions/{id}/approve` | POST | Approve action |
| `/v1/actions/{id}/deny` | POST | Deny action |
| `/v1/decisions` | GET | List decisions |
| `/v1/decisions/{id}` | GET | Get decision detail |
| `/v1/impact/report` | GET | Get ROI attribution |
| `/v1/uploads/sign` | POST | Get upload URL |
| `/v1/tools/trigger` | POST | Trigger n8n workflow |
| `/v1/tools/callback` | POST | n8n callback (internal) |
| `/v1/webhooks/stripe` | POST | Stripe webhook |
| `/v1/webhooks/ghl` | POST | GHL webhook |

---

## 🚀 Next Steps

After completing this setup:

1. [ ] Create your first n8n workflow
2. [ ] Configure GHL webhooks
3. [ ] Test the full flow: Chat → Approve → Execute → Callback
4. [ ] Set up Stripe for payments
5. [ ] Customize your business config
6. [ ] Invite team members

---

## 📞 Need Help?

- Check the component source code in `src/components/`
- Review Edge Functions in `supabase/functions/`
- Look at API client in `src/lib/api-client.ts`

**Your Webhook URLs:**
- n8n Callback: `https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/tools/callback`
- Stripe: `https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/webhooks/stripe`
- GHL: `https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/webhooks/ghl`

---

*Built with ❤️ using Lovable + Supabase + n8n*
