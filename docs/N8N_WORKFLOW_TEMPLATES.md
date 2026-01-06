# 🔧 n8n Workflow Templates for Alpha Vision

> Copy-paste ready workflows for connecting Alpha Vision to your business tools

---

## 📋 Table of Contents

1. [Master Executor Workflow](#1-master-executor-workflow)
2. [GoHighLevel Workflows](#2-gohighlevel-workflows)
3. [Email Workflows](#3-email-workflows)
4. [Slack/Discord Alerts](#4-slackdiscord-alerts)
5. [Google Sheets Logging](#5-google-sheets-logging)
6. [Stripe Workflows](#6-stripe-workflows)
7. [Calendar Integration](#7-calendar-integration)

---

## 1. Master Executor Workflow

This is the MAIN workflow that receives all Alpha Vision actions.

### Step-by-Step Setup

#### Node 1: Webhook Trigger

```json
{
  "name": "Alpha Vision Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "alpha-vision/execute",
    "responseMode": "immediately",
    "options": {}
  }
}
```

**Settings:**
- Response Mode: `Respond Immediately`
- This ensures Alpha Vision gets quick confirmation

#### Node 2: Set Variables

```json
{
  "name": "Extract Variables",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "values": {
      "string": [
        { "name": "action_id", "value": "={{ $json.body.action_id }}" },
        { "name": "org_id", "value": "={{ $json.body.org_id }}" },
        { "name": "action_type", "value": "={{ $json.body.type }}" }
      ],
      "object": [
        { "name": "payload", "value": "={{ $json.body.payload }}" }
      ]
    }
  }
}
```

#### Node 3: Switch (Route by Action Type)

```json
{
  "name": "Route Action",
  "type": "n8n-nodes-base.switch",
  "parameters": {
    "dataPropertyName": "action_type",
    "rules": {
      "rules": [
        { "value": "ghl_tag_lead", "output": 0 },
        { "value": "ghl_create_opportunity", "output": 1 },
        { "value": "send_email", "output": 2 },
        { "value": "send_slack_alert", "output": 3 },
        { "value": "log_to_sheets", "output": 4 },
        { "value": "create_invoice", "output": 5 }
      ]
    }
  }
}
```

#### Node 4: Success Callback (Connect to each branch end)

```json
{
  "name": "Report Success",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://wqdflwqepedqgbcwqqq.supabase.co/functions/v1/webhooks/v1/tools/callback",
    "headers": {
      "Content-Type": "application/json",
      "X-AV-Org-Id": "={{ $node['Extract Variables'].json.org_id }}",
      "X-AV-Action-Id": "={{ $node['Extract Variables'].json.action_id }}",
      "X-AV-Timestamp": "={{ Math.floor(Date.now() / 1000) }}",
      "X-AV-Nonce": "={{ $randomString(16) }}"
    },
    "body": {
      "action_id": "={{ $node['Extract Variables'].json.action_id }}",
      "status": "succeeded",
      "result": {
        "message": "Action completed successfully",
        "executed_at": "={{ new Date().toISOString() }}"
      }
    }
  }
}
```

#### Node 5: Error Callback (Connect to error outputs)

```json
{
  "name": "Report Failure",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://wqdflwqepedqgbcwqqq.supabase.co/functions/v1/webhooks/v1/tools/callback",
    "headers": {
      "Content-Type": "application/json",
      "X-AV-Org-Id": "={{ $node['Extract Variables'].json.org_id }}",
      "X-AV-Action-Id": "={{ $node['Extract Variables'].json.action_id }}",
      "X-AV-Timestamp": "={{ Math.floor(Date.now() / 1000) }}",
      "X-AV-Nonce": "={{ $randomString(16) }}"
    },
    "body": {
      "action_id": "={{ $node['Extract Variables'].json.action_id }}",
      "status": "failed",
      "result": {
        "error": "={{ $json.error?.message || 'Unknown error' }}"
      }
    }
  }
}
```

---

## 2. GoHighLevel Workflows

### 2A: Tag a Lead

**Use Case:** AI recommends tagging a lead as "hot" or "qualified"

```json
{
  "name": "GHL Tag Lead",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://rest.gohighlevel.com/v1/contacts/{{ $json.payload.contact_id }}/tags/",
    "authentication": "headerAuth",
    "headers": {
      "Authorization": "Bearer {{ $credentials.ghlApiKey }}"
    },
    "body": {
      "tags": ["={{ $json.payload.tag }}"]
    }
  }
}
```

**Expected Payload from Alpha Vision:**
```json
{
  "type": "ghl_tag_lead",
  "payload": {
    "contact_id": "abc123",
    "tag": "hot-lead"
  }
}
```

### 2B: Create Opportunity

**Use Case:** AI identifies a qualified lead, creates deal in pipeline

```json
{
  "name": "GHL Create Opportunity",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://rest.gohighlevel.com/v1/pipelines/{{ $json.payload.pipeline_id }}/opportunities/",
    "authentication": "headerAuth",
    "headers": {
      "Authorization": "Bearer {{ $credentials.ghlApiKey }}"
    },
    "body": {
      "name": "={{ $json.payload.name }}",
      "stageId": "={{ $json.payload.stage_id }}",
      "contactId": "={{ $json.payload.contact_id }}",
      "monetaryValue": "={{ $json.payload.value }}"
    }
  }
}
```

### 2C: Send SMS

```json
{
  "name": "GHL Send SMS",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://rest.gohighlevel.com/v1/conversations/messages",
    "headers": {
      "Authorization": "Bearer {{ $credentials.ghlApiKey }}"
    },
    "body": {
      "type": "SMS",
      "contactId": "={{ $json.payload.contact_id }}",
      "message": "={{ $json.payload.message }}"
    }
  }
}
```

### 2D: Start Email Sequence

```json
{
  "name": "GHL Add to Workflow",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://rest.gohighlevel.com/v1/contacts/{{ $json.payload.contact_id }}/workflow/{{ $json.payload.workflow_id }}",
    "headers": {
      "Authorization": "Bearer {{ $credentials.ghlApiKey }}"
    }
  }
}
```

---

## 3. Email Workflows

### 3A: Send via SendGrid

```json
{
  "name": "Send Email - SendGrid",
  "type": "n8n-nodes-base.sendGrid",
  "parameters": {
    "fromEmail": "={{ $json.payload.from || 'noreply@yourdomain.com' }}",
    "toEmail": "={{ $json.payload.to }}",
    "subject": "={{ $json.payload.subject }}",
    "dynamicTemplate": {
      "id": "={{ $json.payload.template_id }}",
      "data": "={{ $json.payload.template_data }}"
    }
  },
  "credentials": {
    "sendGridApi": "SendGrid"
  }
}
```

### 3B: Send via Gmail

```json
{
  "name": "Send Email - Gmail",
  "type": "n8n-nodes-base.gmail",
  "parameters": {
    "operation": "send",
    "toEmail": "={{ $json.payload.to }}",
    "subject": "={{ $json.payload.subject }}",
    "html": "={{ $json.payload.body }}"
  },
  "credentials": {
    "gmailOAuth2": "Gmail"
  }
}
```

---

## 4. Slack/Discord Alerts

### 4A: Slack Notification

**Use Case:** Alert team when high-value action is approved

```json
{
  "name": "Slack Alert",
  "type": "n8n-nodes-base.slack",
  "parameters": {
    "channel": "={{ $json.payload.channel || '#alpha-vision-alerts' }}",
    "text": "",
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "🤖 Alpha Vision Action Executed"
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": "*Action Type:*\n{{ $json.payload.action_type }}"
          },
          {
            "type": "mrkdwn", 
            "text": "*Status:*\n✅ Completed"
          }
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Details:*\n{{ $json.payload.message }}"
        }
      }
    ]
  },
  "credentials": {
    "slackApi": "Slack"
  }
}
```

### 4B: Discord Webhook

```json
{
  "name": "Discord Alert",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "={{ $json.payload.webhook_url }}",
    "body": {
      "embeds": [
        {
          "title": "🤖 Alpha Vision Alert",
          "description": "={{ $json.payload.message }}",
          "color": 5814783,
          "fields": [
            {
              "name": "Action Type",
              "value": "={{ $json.payload.action_type }}",
              "inline": true
            }
          ]
        }
      ]
    }
  }
}
```

---

## 5. Google Sheets Logging

### Log Every Action

**Use Case:** Audit trail of all AI actions

```json
{
  "name": "Log to Sheets",
  "type": "n8n-nodes-base.googleSheets",
  "parameters": {
    "operation": "appendOrUpdate",
    "sheetId": "={{ $json.payload.sheet_id || 'YOUR_SHEET_ID' }}",
    "range": "Actions!A:G",
    "options": {},
    "columns": {
      "Timestamp": "={{ new Date().toISOString() }}",
      "Action ID": "={{ $node['Extract Variables'].json.action_id }}",
      "Action Type": "={{ $node['Extract Variables'].json.action_type }}",
      "Org ID": "={{ $node['Extract Variables'].json.org_id }}",
      "Status": "Executed",
      "Details": "={{ JSON.stringify($json.payload) }}",
      "Result": "={{ JSON.stringify($json.result || {}) }}"
    }
  },
  "credentials": {
    "googleSheetsOAuth2Api": "Google Sheets"
  }
}
```

---

## 6. Stripe Workflows

### 6A: Create Invoice

```json
{
  "name": "Stripe Create Invoice",
  "type": "n8n-nodes-base.stripe",
  "parameters": {
    "operation": "create",
    "resource": "invoice",
    "customerId": "={{ $json.payload.customer_id }}",
    "additionalFields": {
      "description": "={{ $json.payload.description }}",
      "autoAdvance": true
    }
  },
  "credentials": {
    "stripeApi": "Stripe"
  }
}
```

### 6B: Create Invoice Item

```json
{
  "name": "Stripe Add Line Item",
  "type": "n8n-nodes-base.stripe",
  "parameters": {
    "operation": "create",
    "resource": "invoiceItem",
    "customer": "={{ $json.payload.customer_id }}",
    "amount": "={{ $json.payload.amount * 100 }}",
    "currency": "usd",
    "description": "={{ $json.payload.line_item }}"
  }
}
```

### 6C: Send Invoice

```json
{
  "name": "Stripe Send Invoice",
  "type": "n8n-nodes-base.stripe",
  "parameters": {
    "operation": "finalize",
    "resource": "invoice",
    "invoiceId": "={{ $json.id }}"
  }
}
```

---

## 7. Calendar Integration

### 7A: Create Google Calendar Event

```json
{
  "name": "Create Calendar Event",
  "type": "n8n-nodes-base.googleCalendar",
  "parameters": {
    "operation": "create",
    "calendarId": "primary",
    "title": "={{ $json.payload.title }}",
    "start": "={{ $json.payload.start_time }}",
    "end": "={{ $json.payload.end_time }}",
    "attendees": "={{ $json.payload.attendees }}",
    "description": "Created by Alpha Vision\n\n={{ $json.payload.description }}"
  },
  "credentials": {
    "googleCalendarOAuth2Api": "Google Calendar"
  }
}
```

---

## 🔌 Complete Workflow Import

Copy this JSON to import a basic workflow into n8n:

```json
{
  "name": "Alpha Vision - Master Executor",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "alpha-vision/execute",
        "responseMode": "immediately"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            { "name": "action_id", "value": "={{ $json.body.action_id }}" },
            { "name": "org_id", "value": "={{ $json.body.org_id }}" },
            { "name": "action_type", "value": "={{ $json.body.type }}" }
          ]
        }
      },
      "name": "Set Variables",
      "type": "n8n-nodes-base.set",
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://wqdflwqepedqgbcwqqq.supabase.co/functions/v1/webhooks/v1/tools/callback",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/json" },
            { "name": "X-AV-Org-Id", "value": "={{ $json.org_id }}" },
            { "name": "X-AV-Action-Id", "value": "={{ $json.action_id }}" },
            { "name": "X-AV-Timestamp", "value": "={{ Math.floor(Date.now() / 1000) }}" },
            { "name": "X-AV-Nonce", "value": "={{ $randomString(16) }}" }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "action_id", "value": "={{ $json.action_id }}" },
            { "name": "status", "value": "succeeded" },
            { "name": "result", "value": "={{ { message: 'Action completed', action_type: $json.action_type } }}" }
          ]
        }
      },
      "name": "Callback Success",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Set Variables", "type": "main", "index": 0 }]]
    },
    "Set Variables": {
      "main": [[{ "node": "Callback Success", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## 🎯 Quick Setup Checklist

- [ ] Create n8n account (cloud.n8n.io)
- [ ] Import Master Executor workflow
- [ ] Activate the workflow
- [ ] Copy webhook URL
- [ ] Add `N8N_WEBHOOK_URL` secret in Alpha Vision
- [ ] Test with a simple action
- [ ] Add GHL credentials if using GoHighLevel
- [ ] Add Stripe credentials if using Stripe
- [ ] Add Slack/Discord webhooks for alerts

---

## 🔐 Security Notes

1. **Never share your webhook URLs publicly**
2. **Use credentials manager** in n8n for API keys
3. **The callback uses timestamp validation** (5-minute window)
4. **Consider adding HMAC verification** for production

---

*These templates work with Alpha Vision's action system. Customize as needed!*
