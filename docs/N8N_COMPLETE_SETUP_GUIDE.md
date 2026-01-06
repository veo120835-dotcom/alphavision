# 🔧 n8n Complete Setup Guide

> **Step-by-step instructions to connect Alpha Vision with n8n**
> Difficulty: Beginner | Time: 30-45 minutes

---

## 📋 What You'll Set Up

1. ✅ Create n8n account (free)
2. ✅ Create Master Executor workflow
3. ✅ Get your webhook URL
4. ✅ Add secrets to Alpha Vision
5. ✅ Test the complete flow

---

## Step 1: Create n8n Account

### 1.1 Go to n8n Cloud

1. Open your browser
2. Go to: **https://app.n8n.cloud/register**
3. Click "Start free trial" (no credit card needed)

### 1.2 Sign Up

1. Enter your email
2. Create a password
3. Click "Create account"
4. Verify your email (check inbox)

### 1.3 First Login

1. Click the verification link in your email
2. You'll see the n8n dashboard
3. 🎉 Account created!

---

## Step 2: Create Your First Workflow

### 2.1 Create New Workflow

1. Click the **"+"** button in the top right
2. Or click **"Create new workflow"**
3. Name it: **"Alpha Vision Master Executor"**

### 2.2 Add Webhook Node (Entry Point)

1. Click **"Add first step"**
2. Search for **"Webhook"**
3. Click on **Webhook** node
4. Configure it:
   - **HTTP Method**: POST
   - **Path**: `alpha-vision-execute` (or any name you want)
   - **Authentication**: None (for now, we'll use HMAC later)
   - **Response Mode**: "When Last Node Finishes"

### 2.3 Copy Your Webhook URL

1. Click on the Webhook node
2. Look for **"Test URL"** and **"Production URL"**
3. **IMPORTANT**: Copy the **Production URL**
   - It looks like: `https://YOUR-INSTANCE.app.n8n.cloud/webhook/alpha-vision-execute`
4. Save this URL - you'll need it later!

### 2.4 Add a Switch Node (Route by Action Type)

1. Click the **"+"** after the Webhook node
2. Search for **"Switch"**
3. Add the Switch node
4. Configure:
   - **Mode**: Rules
   - **Add Rule 1**: 
     - Value: `{{ $json.type }}`
     - Operation: Equal
     - Value 2: `ghl_tag_lead`
     - Output: 0
   - **Add Rule 2**:
     - Value: `{{ $json.type }}`
     - Operation: Equal
     - Value 2: `send_email`
     - Output: 1
   - **Add Rule 3**:
     - Value: `{{ $json.type }}`
     - Operation: Equal
     - Value 2: `create_invoice`
     - Output: 2
   - **Fallback**: Output 3

---

## Step 3: Add Action Handlers

### 3.1 GHL Tag Lead Handler (Output 0)

1. From Switch Output 0, add **"HTTP Request"** node
2. Configure:
   - **Method**: POST
   - **URL**: `https://rest.gohighlevel.com/v1/contacts/{{ $json.payload.contact_id }}/tags`
   - **Authentication**: Header Auth
     - Name: `Authorization`
     - Value: `Bearer YOUR_GHL_API_KEY`
   - **Body Parameters**:
     - `tags`: `{{ $json.payload.tag }}`

### 3.2 Send Email Handler (Output 1)

1. From Switch Output 1, add **"Send Email"** node (or Gmail/SMTP)
2. Configure with your email settings

### 3.3 Create Invoice Handler (Output 2)

1. From Switch Output 2, add **"Stripe"** node
2. Search for "Stripe" and add it
3. Configure:
   - **Operation**: Create Invoice
   - **Customer**: `{{ $json.payload.customer_id }}`
   - **Amount**: `{{ $json.payload.amount }}`

### 3.4 Fallback Handler (Output 3)

1. From Switch Output 3 (fallback), add **"Set"** node
2. Set a field:
   - Name: `error`
   - Value: `Unknown action type`

---

## Step 4: Add Callback to Alpha Vision

After each action handler, add a callback to Alpha Vision:

### 4.1 Add HTTP Request Node (Callback)

1. After each handler, add **"HTTP Request"** node
2. Configure:
   - **Method**: POST
   - **URL**: `https://wqdflwqepedqgbcwqqq.supabase.co/functions/v1/webhooks/v1/tools/callback`
   - **Headers**:
     - `Content-Type`: `application/json`
     - `X-AV-Org-Id`: `{{ $json.org_id }}`
     - `X-AV-Action-Id`: `{{ $json.action_id }}`
     - `X-AV-Timestamp`: `{{ Math.floor(Date.now() / 1000) }}`
     - `X-AV-Nonce`: `{{ $randomUUID }}`
   - **Body**:
```json
{
  "action_id": "{{ $json.action_id }}",
  "status": "succeeded",
  "result": {
    "message": "Action completed successfully",
    "data": "{{ JSON.stringify($json) }}"
  }
}
```

---

## Step 5: Complete Workflow Diagram

Your workflow should look like this:

```
┌─────────────┐
│   Webhook   │
│  (trigger)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Switch    │
│ (route by   │
│   type)     │
└──────┬──────┘
       │
   ┌───┴───┬───────┬────────┐
   ▼       ▼       ▼        ▼
┌─────┐ ┌─────┐ ┌─────┐ ┌─────────┐
│ GHL │ │Email│ │Stripe│ │Fallback │
│ Tag │ │Send │ │Invoice│ │  Error  │
└──┬──┘ └──┬──┘ └──┬──┘ └────┬────┘
   │       │       │         │
   ▼       ▼       ▼         ▼
┌─────────────────────────────────┐
│     HTTP Request (Callback)      │
│     → Back to Alpha Vision       │
└─────────────────────────────────┘
```

---

## Step 6: Activate Your Workflow

1. Click the **"Inactive"** toggle in the top right
2. Change it to **"Active"**
3. ✅ Your workflow is now live!

---

## Step 7: Get Your Webhook URL

1. Click on the **Webhook node**
2. Find **"Production URL"**
3. Copy the full URL
   - Example: `https://your-instance.app.n8n.cloud/webhook/alpha-vision-execute`

---

## Step 8: Add Secrets to Alpha Vision

### 8.1 Add N8N_WEBHOOK_URL

Go to Alpha Vision → API Keys → Add:
- **Name**: n8n Webhook URL
- **Value**: Your production webhook URL from Step 7

### 8.2 Generate Webhook Secret

Run this in your terminal:
```bash
openssl rand -hex 32
```

Copy the output (looks like: `a1b2c3d4e5f6...`)

### 8.3 Add N8N_WEBHOOK_SECRET

Go to Alpha Vision → API Keys → Add:
- **Name**: n8n Webhook Secret
- **Value**: The hex string you generated

---

## Step 9: Test the Connection

### 9.1 From Alpha Vision

1. Go to **Chat**
2. Ask: "Create a test action to tag a lead"
3. The AI will propose an action
4. Click **Approve**
5. Check n8n execution history

### 9.2 Check n8n Execution

1. In n8n, go to **Executions** (left sidebar)
2. You should see a new execution
3. Click to view the flow
4. ✅ If you see all green checkmarks, it worked!

---

## Step 10: Add More Action Types

### 10.1 Supported Actions

| Action Type | What It Does | Required Integration |
|-------------|--------------|---------------------|
| `ghl_tag_lead` | Add tag to GHL contact | GHL API Key |
| `ghl_create_opportunity` | Create deal in GHL | GHL API Key |
| `send_email` | Send email via Gmail/SMTP | Email config |
| `send_slack` | Post to Slack | Slack webhook |
| `create_invoice` | Stripe invoice | Stripe API Key |
| `schedule_calendar` | Create calendar event | Google OAuth |
| `update_sheet` | Log to Google Sheets | Google OAuth |

### 10.2 Add a New Action

1. Add a new output to the Switch node
2. Connect an action node (HTTP Request, Stripe, etc.)
3. Connect the callback node
4. Save and activate

---

## 🔒 Security: Add HMAC Verification (Optional but Recommended)

### In n8n:

1. After the Webhook node, add a **"Code"** node
2. Add this code:

```javascript
const crypto = require('crypto');

const body = JSON.stringify($input.item.json);
const timestamp = $input.item.headers['x-av-timestamp'];
const nonce = $input.item.headers['x-av-nonce'];
const signature = $input.item.headers['x-av-signature'];
const secret = 'YOUR_WEBHOOK_SECRET_HERE';

const expectedSig = crypto
  .createHmac('sha256', secret)
  .update(`${body}.${timestamp}.${nonce}`)
  .digest('hex');

if (signature !== expectedSig) {
  throw new Error('Invalid signature');
}

return $input.item;
```

---

## 📋 Troubleshooting

### "Webhook not receiving data"

1. Make sure workflow is **Active** (not Inactive)
2. Check you're using the **Production URL**, not Test URL
3. Verify the URL in your secrets matches exactly

### "Callback failing"

1. Check the Supabase function URL is correct
2. Verify headers are being sent
3. Check the action_id matches

### "GHL connection failing"

1. Verify your GHL API key is correct
2. Check the contact ID exists
3. Ensure your GHL plan includes API access

### "Execution shows errors"

1. Click on the failed node
2. Read the error message
3. Most common: missing credentials or wrong URL

---

## 🎉 You're Done!

Your Alpha Vision is now connected to n8n!

**What happens now:**
1. You chat with Alpha Vision
2. AI proposes actions
3. You approve (or it auto-executes in Autopilot)
4. n8n receives the action
5. n8n executes it (GHL, Stripe, Email, etc.)
6. n8n sends callback to Alpha Vision
7. You see the result in the UI

---

## 📞 Need Help?

- **n8n Community**: https://community.n8n.io
- **n8n Docs**: https://docs.n8n.io
- **Alpha Vision Docs**: See other files in `/docs`

---

## 🚀 Advanced: MCP Connection (Optional)

For deeper integration, you can connect n8n via MCP:

1. In n8n, go to Settings → MCP Access
2. Enable MCP
3. Copy the MCP URL
4. In Lovable, go to Settings → Connectors → n8n
5. Paste the MCP URL

This allows the AI to directly see and trigger your n8n workflows!
