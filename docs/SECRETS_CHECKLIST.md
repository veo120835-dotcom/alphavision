# 🔐 Alpha Vision - Secrets & Configuration Checklist

> All secrets you need to add for full functionality

---

## ✅ Required Secrets

### Core System (Already Configured)
| Secret | Status | Purpose |
|--------|--------|---------|
| `SUPABASE_URL` | ✅ Auto | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Auto | Backend access |
| `LOVABLE_API_KEY` | ✅ Auto | AI model access |

### n8n Integration
| Secret | Status | How to Get |
|--------|--------|------------|
| `N8N_WEBHOOK_URL` | ❌ Add | n8n → Workflow → Webhook node → Copy URL |
| `N8N_WEBHOOK_SECRET` | ❌ Add | Generate: `openssl rand -hex 32` |

### Stripe Integration  
| Secret | Status | How to Get |
|--------|--------|------------|
| `STRIPE_SECRET_KEY` | ❌ Add | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | ❌ Add | Stripe Dashboard → Webhooks → Signing secret |

### GoHighLevel (Optional)
| Secret | Status | How to Get |
|--------|--------|------------|
| `GHL_API_KEY` | ❌ Add | GHL Settings → API Keys |
| `GHL_LOCATION_ID` | ❌ Add | GHL URL after /location/ |

### Google OAuth (Optional)
| Secret | Status | How to Get |
|--------|--------|------------|
| `GOOGLE_CLIENT_ID` | ❌ Add | Google Cloud Console → OAuth |
| `GOOGLE_CLIENT_SECRET` | ❌ Add | Google Cloud Console → OAuth |

---

## 📝 How to Add Secrets

### In Lovable

1. Open your project
2. Ask the AI: "Add secret N8N_WEBHOOK_URL"
3. Enter the value in the secure form
4. Click confirm

### Order of Setup

```
1. N8N_WEBHOOK_URL (enables automation)
   ↓
2. N8N_WEBHOOK_SECRET (enables security)
   ↓
3. STRIPE_SECRET_KEY (enables payments)
   ↓
4. STRIPE_WEBHOOK_SECRET (enables payment events)
   ↓
5. GHL keys (enables CRM - optional)
```

---

## 🔒 Security Notes

- **Never share secrets** in chat, code, or screenshots
- **Rotate secrets** every 90 days
- **Use test keys** during development
- **Verify signatures** before processing webhooks (already implemented)

---

## 🧪 Testing Your Setup

### Test n8n Connection
```bash
# In your n8n workflow, the webhook should receive:
{
  "action_id": "uuid",
  "org_id": "uuid", 
  "type": "test_action",
  "payload": {}
}
```

### Test Stripe Webhook
```bash
# Use Stripe CLI
stripe listen --forward-to https://YOUR_PROJECT.supabase.co/functions/v1/webhooks/v1/webhooks/stripe
stripe trigger payment_intent.succeeded
```

### Test GHL Webhook
1. Go to GHL → Settings → Webhooks
2. Add: `https://YOUR_PROJECT.supabase.co/functions/v1/webhooks/v1/webhooks/ghl`
3. Trigger a test event (create contact)

---

## ✨ After Setup Complete

You should see:
- ✅ Actions execute after approval
- ✅ Payments appear in Revenue dashboard
- ✅ Leads sync from GHL
- ✅ Real-time updates in UI

---

*Missing a secret? Ask the AI to add it for you!*
