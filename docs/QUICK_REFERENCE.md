# 🎯 Alpha Vision - Quick Reference Card

> Everything you need to know in one page

---

## 🔑 Required Secrets

| Secret | Where to Get | Priority |
|--------|--------------|----------|
| `N8N_WEBHOOK_URL` | n8n → Workflow → Webhook node → Production URL | ⭐ CRITICAL |
| `N8N_WEBHOOK_SECRET` | Generate: `openssl rand -hex 32` | ⭐ CRITICAL |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys | ⭐ CRITICAL |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → Signing secret | ⭐ CRITICAL |
| `GHL_API_KEY` | GHL Settings → Integrations → API | Optional |
| `GHL_LOCATION_ID` | GHL URL after /location/ | Optional |

---

## 📡 Webhook URLs to Configure

### In Stripe Dashboard
```
URL: https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/webhooks/stripe
Events: invoice.paid, checkout.session.completed, customer.subscription.*
```

### In GoHighLevel
```
URL: https://unoxusaqjdhcypsqnlsj.supabase.co/functions/v1/webhooks/v1/webhooks/ghl
Events: Contact Created, Opportunity Won, Appointment Booked
```

---

## 🔧 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/sessions` | POST | Create chat session |
| `/v1/chat/send` | POST | Send message, get AI response |
| `/v1/policy` | GET/PUT | Manage permission contract |
| `/v1/actions` | GET | List pending/completed actions |
| `/v1/actions/:id/approve` | POST | Approve action for execution |
| `/v1/decisions` | GET | Get decision log |
| `/v1/impact/report` | GET | ROI attribution report |

---

## 🚀 Quick Setup Checklist

- [ ] Create n8n account at cloud.n8n.io
- [ ] Create "Master Executor" workflow
- [ ] Get webhook production URL
- [ ] Add N8N_WEBHOOK_URL secret
- [ ] Generate and add N8N_WEBHOOK_SECRET
- [ ] Connect Stripe (if using payments)
- [ ] Connect GHL (if using CRM)
- [ ] Test: Chat → Approve Action → Check n8n

---

## 🧭 Navigation

| View | What It Does |
|------|--------------|
| **Dashboard** | Overview, metrics, setup status |
| **Chat** | Talk to AI advisor |
| **Approvals** | Approve/deny AI actions |
| **Leads** | CRM pipeline |
| **Revenue** | Payment tracking |
| **API Keys** | Configure integrations |
| **Settings** | Business config, policy |

---

## 🤖 Autonomy Levels

| Level | Name | Behavior |
|-------|------|----------|
| 0 | Advisory | AI recommends, you decide |
| 1 | Drafting | AI drafts, you approve |
| 2 | Operating | AI executes within caps |
| 3 | Autopilot | AI runs autonomously |

---

## ⚠️ Safety Features

- **HMAC Verification** - All webhooks cryptographically verified
- **Stripe Signatures** - Payment webhooks validated
- **RLS Policies** - Data isolated per organization
- **Approval Gates** - High-value actions require human approval
- **Kill Criteria** - Auto-disable if runway < 6 months

---

## 📚 Documentation Files

| File | Content |
|------|---------|
| `docs/ALPHA_VISION_COMPLETE_MANUAL.md` | Full setup guide |
| `docs/N8N_COMPLETE_SETUP_GUIDE.md` | Step-by-step n8n setup |
| `docs/N8N_WORKFLOW_TEMPLATES.md` | Copy-paste workflows |
| `docs/GAP_ANALYSIS.md` | What's built vs missing |
| `docs/FRONTEND_UX_GUIDE.md` | UX patterns |
| `docs/SECRETS_CHECKLIST.md` | All secrets needed |
| `docs/QUICK_REFERENCE.md` | This file |

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Actions not executing | Check N8N_WEBHOOK_URL secret |
| Webhooks failing | Verify HMAC secret matches |
| Payments not tracking | Check Stripe webhook config |
| Leads not syncing | Verify GHL webhook URL |
| Real-time not working | Check Supabase connection |

---

## 🎉 You're Ready!

1. Open Alpha Vision
2. Complete the onboarding wizard
3. Add your secrets (API Keys page)
4. Start chatting with your AI advisor!

**Need help?** Check the docs folder or the in-app guides.
