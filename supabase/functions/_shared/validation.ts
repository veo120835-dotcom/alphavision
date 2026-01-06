import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export class ValidationError extends Error {
  constructor(public errors: z.ZodError) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error);
    }
    throw error;
  }
}

export const commonSchemas = {
  uuid: z.string().uuid(),
  email: z.string().email().max(255),
  url: z.string().url().max(2048),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  positiveNumber: z.number().positive(),
  nonNegativeNumber: z.number().nonnegative(),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]),
  timestamp: z.string().datetime(),
  pagination: z.object({
    limit: z.number().int().positive().max(100).default(20),
    offset: z.number().int().nonnegative().default(0),
  }),
};

export const chatSendSchema = z.object({
  org_id: commonSchemas.uuid.optional(),
  session_id: commonSchemas.uuid,
  message: z.object({
    text: z.string().min(1).max(10000),
    attachments: z.array(z.object({
      type: z.enum(["file", "url", "text"]),
      name: z.string().max(255).optional(),
      url: commonSchemas.url.optional(),
      text: z.string().max(50000).optional(),
      mime_type: z.string().max(100).optional(),
    })).optional(),
  }),
  ui_state: z.object({
    mode: z.enum(["advisor", "operator", "autopilot"]),
    risk: z.object({
      personal: z.enum(["conservative", "balanced", "aggressive"]),
      ops: z.enum(["conservative", "balanced", "aggressive"]),
      marketing: z.enum(["conservative", "balanced", "aggressive"]),
    }).optional(),
  }).optional(),
  client_context: z.object({
    timezone: z.string().max(100).optional(),
    locale: z.string().max(10).optional(),
  }).optional(),
});

export const actionApprovalSchema = z.object({
  approve: z.boolean(),
  override_reason: z.string().max(1000).optional(),
  reason: z.string().max(1000).optional(),
  confirm: z.object({
    understands_cost: z.boolean(),
    understands_irreversibility: z.boolean(),
  }).optional(),
});

export const toolCallbackSchema = z.object({
  action_id: commonSchemas.uuid,
  status: z.enum(["succeeded", "failed"]),
  result: z.record(z.unknown()),
  rollback: z.object({
    supported: z.boolean(),
    instructions: z.string().max(1000).optional(),
    payload: z.record(z.unknown()).optional(),
  }).optional(),
  logs: z.array(z.object({
    ts: commonSchemas.timestamp,
    level: z.enum(["info", "warn", "error"]),
    message: z.string().max(1000),
    data: z.record(z.unknown()).optional(),
  })).optional(),
});

export const webhookPayloadSchema = z.object({
  provider: z.enum(["stripe", "ghl", "n8n"]),
  type: z.string().max(100),
  external_id: z.string().max(255).optional(),
  org_id: commonSchemas.uuid.optional(),
  data: z.record(z.unknown()),
});

export const uploadSignSchema = z.object({
  filename: z.string().min(1).max(255),
  mime_type: z.string().min(1).max(100),
  size_bytes: z.number().int().positive().max(100 * 1024 * 1024),
});

export const leadSchema = z.object({
  email: commonSchemas.email,
  name: z.string().min(1).max(255),
  phone: commonSchemas.phoneNumber.optional(),
  company: z.string().max(255).optional(),
  status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]).optional(),
  value: commonSchemas.nonNegativeNumber.optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).optional(),
});

export const revenueEventSchema = z.object({
  amount: commonSchemas.positiveNumber,
  currency: commonSchemas.currency,
  type: z.enum(["payment", "refund", "chargeback", "subscription"]),
  external_id: z.string().max(255).optional(),
  customer_email: commonSchemas.email.optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 10000);
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const validated = validateRequest(schema, data);

  if (typeof validated === "object" && validated !== null) {
    return sanitizeObject(validated) as T;
  }

  return validated;
}

function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === "object" && obj !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

export function formatValidationError(error: ValidationError): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.errors.issues.map(issue => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
