// ============================================
// AGENT TOOLS - Calendar, Payments, n8n Bridge
// ============================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret, x-n8n-signature',
};

// ============ TOOL DEFINITIONS ============

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
  execute: (params: Record<string, unknown>) => Promise<string>;
}

// --- TOOL 1: CALENDAR AVAILABILITY ---
export const checkCalendarTool: Tool = {
  name: "check_calendar",
  description: "Checks calendar availability for a specific date range. Use when the prospect asks about scheduling.",
  parameters: {
    type: "object",
    properties: {
      startTime: { type: "string", description: "ISO date string for range start" },
      endTime: { type: "string", description: "ISO date string for range end" },
      organizationId: { type: "string", description: "Organization ID to fetch calendar tokens" }
    },
    required: ["startTime", "endTime", "organizationId"]
  },
  execute: async ({ startTime, endTime, organizationId }) => {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      // Fetch OAuth tokens for this organization
      const tokenResponse = await fetch(
        `${supabaseUrl}/rest/v1/oauth_tokens?organization_id=eq.${organizationId}&provider=eq.google`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          }
        }
      );
      
      const tokens = await tokenResponse.json();
      
      if (!tokens || tokens.length === 0) {
        return JSON.stringify({ 
          available: false, 
          error: "Google Calendar not connected. Please connect via Integrations." 
        });
      }

      const accessToken = tokens[0].access_token_encrypted; // In production, decrypt this
      
      // Call Google Calendar FreeBusy API
      const calendarResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/freeBusy',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timeMin: startTime,
            timeMax: endTime,
            items: [{ id: 'primary' }],
          }),
        }
      );

      const calendarData = await calendarResponse.json();
      
      if (calendarData.error) {
        return JSON.stringify({ 
          available: false, 
          error: calendarData.error.message 
        });
      }

      const busySlots = calendarData.calendars?.primary?.busy || [];
      
      return JSON.stringify({
        available: busySlots.length === 0,
        busySlots,
        message: busySlots.length === 0 
          ? "Calendar is free during this time" 
          : `${busySlots.length} conflicting events found`
      });
    } catch (error) {
      return JSON.stringify({ 
        available: false, 
        error: error instanceof Error ? error.message : 'Calendar check failed' 
      });
    }
  }
};

// --- TOOL 2: CREATE CALENDAR BOOKING ---
export const createBookingTool: Tool = {
  name: "create_booking",
  description: "Creates a calendar event/booking for a call with the prospect.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "Meeting title" },
      startTime: { type: "string", description: "ISO date string for meeting start" },
      endTime: { type: "string", description: "ISO date string for meeting end" },
      attendeeEmail: { type: "string", description: "Email of the prospect/attendee" },
      organizationId: { type: "string", description: "Organization ID" }
    },
    required: ["title", "startTime", "endTime", "attendeeEmail", "organizationId"]
  },
  execute: async ({ title, startTime, endTime, attendeeEmail, organizationId }) => {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const tokenResponse = await fetch(
        `${supabaseUrl}/rest/v1/oauth_tokens?organization_id=eq.${organizationId}&provider=eq.google`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          }
        }
      );
      
      const tokens = await tokenResponse.json();
      
      if (!tokens || tokens.length === 0) {
        return JSON.stringify({ success: false, error: "Google Calendar not connected" });
      }

      const accessToken = tokens[0].access_token_encrypted;
      
      const eventResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: title,
            start: { dateTime: startTime },
            end: { dateTime: endTime },
            attendees: [{ email: attendeeEmail }],
            conferenceData: {
              createRequest: { requestId: crypto.randomUUID() }
            },
          }),
        }
      );

      const event = await eventResponse.json();
      
      return JSON.stringify({
        success: true,
        eventId: event.id,
        meetLink: event.hangoutLink,
        message: `Booking created: ${title}`
      });
    } catch (error) {
      return JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Booking creation failed' 
      });
    }
  }
};

// --- TOOL 3: STRIPE PAYMENT LINK ---
export const createPaymentLinkTool: Tool = {
  name: "create_payment_link",
  description: "Generates a Stripe payment link for the closed deal. Use when prospect is ready to pay.",
  parameters: {
    type: "object",
    properties: {
      amount: { type: "number", description: "Amount in USD (e.g., 5000 for $5,000)" },
      productName: { type: "string", description: "Name of the product/service" },
      customerEmail: { type: "string", description: "Customer email for the payment" },
      leadId: { type: "string", description: "Lead ID to track the payment" }
    },
    required: ["amount", "productName", "customerEmail"]
  },
  execute: async ({ amount, productName, customerEmail, leadId }) => {
    try {
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      
      if (!stripeKey) {
        return JSON.stringify({ 
          success: false, 
          error: "Stripe not configured. Add STRIPE_SECRET_KEY to secrets." 
        });
      }

      // Create a price dynamically
      const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'unit_amount': String(Number(amount) * 100), // Stripe uses cents
          'currency': 'usd',
          'product_data[name]': String(productName),
        }),
      });

      const price = await priceResponse.json();
      
      if (price.error) {
        return JSON.stringify({ success: false, error: price.error.message });
      }

      // Create payment link
      const linkResponse = await fetch('https://api.stripe.com/v1/payment_links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'line_items[0][price]': price.id,
          'line_items[0][quantity]': '1',
          'metadata[lead_id]': String(leadId || ''),
          'metadata[customer_email]': String(customerEmail),
        }),
      });

      const link = await linkResponse.json();
      
      if (link.error) {
        return JSON.stringify({ success: false, error: link.error.message });
      }

      return JSON.stringify({
        success: true,
        paymentUrl: link.url,
        amount: amount,
        message: `Payment link created for $${amount}`
      });
    } catch (error) {
      return JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment link creation failed' 
      });
    }
  }
};

// --- TOOL 4: WISE TRANSFER ---
export const createWiseTransferTool: Tool = {
  name: "create_wise_transfer",
  description: "Initiates a Wise (TransferWise) payment transfer.",
  parameters: {
    type: "object",
    properties: {
      amount: { type: "number", description: "Amount to transfer" },
      currency: { type: "string", description: "Currency code (e.g., USD, EUR, GBP)" },
      recipientEmail: { type: "string", description: "Recipient email" },
      reference: { type: "string", description: "Payment reference/description" }
    },
    required: ["amount", "currency", "recipientEmail", "reference"]
  },
  execute: async ({ amount, currency, recipientEmail, reference }) => {
    try {
      const wiseKey = Deno.env.get('WISE_API_KEY');
      
      if (!wiseKey) {
        return JSON.stringify({ 
          success: false, 
          error: "Wise not configured. Add WISE_API_KEY to secrets." 
        });
      }

      // Get profile ID first
      const profileResponse = await fetch('https://api.wise.com/v1/profiles', {
        headers: { 'Authorization': `Bearer ${wiseKey}` },
      });
      
      const profiles = await profileResponse.json();
      const profileId = profiles[0]?.id;
      
      if (!profileId) {
        return JSON.stringify({ success: false, error: "No Wise profile found" });
      }

      // Create quote
      const quoteResponse = await fetch('https://api.wise.com/v3/profiles/' + profileId + '/quotes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${wiseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceCurrency: currency,
          targetCurrency: currency,
          sourceAmount: amount,
        }),
      });
      
      const quote = await quoteResponse.json();

      return JSON.stringify({
        success: true,
        quoteId: quote.id,
        rate: quote.rate,
        fee: quote.fee,
        message: `Wise quote created for ${amount} ${currency}. Recipient: ${recipientEmail}`
      });
    } catch (error) {
      return JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Wise transfer failed' 
      });
    }
  }
};

// --- TOOL 5: N8N AUTOMATION BRIDGE ---
export const triggerN8nAutomationTool: Tool = {
  name: "trigger_n8n_automation",
  description: "Triggers a background workflow in n8n for CRM updates, Slack alerts, email sequences, or any custom automation.",
  parameters: {
    type: "object",
    properties: {
      workflow: { 
        type: "string", 
        enum: ["update_crm", "send_slack_alert", "start_email_sequence", "sync_ghl", "custom"],
        description: "The specific workflow to run"
      },
      payload: { 
        type: "string", 
        description: "JSON string of data to send (email, name, deal_value, etc.)" 
      },
      customWebhook: {
        type: "string",
        description: "Custom webhook path for 'custom' workflow type"
      }
    },
    required: ["workflow", "payload"]
  },
  execute: async ({ workflow, payload, customWebhook }) => {
    try {
      const n8nBaseUrl = Deno.env.get('N8N_WEBHOOK_URL');
      
      if (!n8nBaseUrl) {
        return JSON.stringify({ 
          success: false, 
          error: "n8n not configured. Add N8N_WEBHOOK_URL to secrets." 
        });
      }

      // Construct the webhook URL based on workflow type
      let webhookPath = workflow === 'custom' && customWebhook 
        ? customWebhook 
        : workflow;
      
      // Handle if base URL already has path or not
      const n8nUrl = n8nBaseUrl.endsWith('/') 
        ? `${n8nBaseUrl}${webhookPath}`
        : `${n8nBaseUrl}/${webhookPath}`;
      
      const n8nApiKey = Deno.env.get('N8N_API_KEY');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (n8nApiKey) {
        headers['Authorization'] = `Bearer ${n8nApiKey}`;
      }

      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers,
        body: typeof payload === 'string' ? payload : JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }

      if (!response.ok) {
        return JSON.stringify({ 
          success: false, 
          error: `n8n returned ${response.status}: ${responseText}` 
        });
      }

      return JSON.stringify({
        success: true,
        workflow,
        response: responseData,
        message: `Automation '${workflow}' triggered successfully`
      });
    } catch (error) {
      return JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'n8n trigger failed' 
      });
    }
  }
};

// --- TOOL 6: SEND EMAIL VIA GMAIL ---
export const sendEmailTool: Tool = {
  name: "send_email",
  description: "Sends an email via Gmail API using connected OAuth credentials.",
  parameters: {
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient email address" },
      subject: { type: "string", description: "Email subject line" },
      body: { type: "string", description: "Email body (plain text or HTML)" },
      organizationId: { type: "string", description: "Organization ID for OAuth lookup" }
    },
    required: ["to", "subject", "body", "organizationId"]
  },
  execute: async ({ to, subject, body, organizationId }) => {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const tokenResponse = await fetch(
        `${supabaseUrl}/rest/v1/oauth_tokens?organization_id=eq.${organizationId}&provider=eq.google`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          }
        }
      );
      
      const tokens = await tokenResponse.json();
      
      if (!tokens || tokens.length === 0) {
        return JSON.stringify({ success: false, error: "Gmail not connected" });
      }

      const accessToken = tokens[0].access_token_encrypted;
      
      // Construct email in RFC 2822 format
      const emailLines = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body
      ];
      const email = emailLines.join('\r\n');
      const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedEmail }),
        }
      );

      const result = await response.json();
      
      if (result.error) {
        return JSON.stringify({ success: false, error: result.error.message });
      }

      return JSON.stringify({
        success: true,
        messageId: result.id,
        message: `Email sent to ${to}`
      });
    } catch (error) {
      return JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Email send failed' 
      });
    }
  }
};

// ============ TOOL REGISTRY ============

export const agentTools: Tool[] = [
  checkCalendarTool,
  createBookingTool,
  createPaymentLinkTool,
  createWiseTransferTool,
  triggerN8nAutomationTool,
  sendEmailTool,
];

export function getToolByName(name: string): Tool | undefined {
  return agentTools.find(tool => tool.name === name);
}

export function getToolDefinitions() {
  return agentTools.map(({ name, description, parameters }) => ({
    type: "function" as const,
    function: { name, description, parameters }
  }));
}

export async function executeTool(name: string, params: Record<string, unknown>): Promise<string> {
  const tool = getToolByName(name);
  if (!tool) {
    return JSON.stringify({ error: `Tool '${name}' not found` });
  }
  return tool.execute(params);
}
