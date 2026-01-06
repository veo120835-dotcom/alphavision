import { z } from 'zod';

// ========== AUTH SCHEMAS ==========
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// ========== CHAT SCHEMAS ==========
export const chatMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
  attachments: z.array(z.object({
    type: z.enum(['file', 'url', 'text']),
    name: z.string().optional(),
    url: z.string().url().optional(),
    text: z.string().optional(),
    mime_type: z.string().optional(),
  })).optional(),
});

export const chatSendSchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  message: chatMessageSchema,
  ui_state: z.object({
    mode: z.enum(['advisor', 'operator', 'autopilot']),
    risk: z.object({
      personal: z.enum(['conservative', 'balanced', 'aggressive']),
      ops: z.enum(['conservative', 'balanced', 'aggressive']),
      marketing: z.enum(['conservative', 'balanced', 'aggressive']),
    }).optional(),
  }).optional(),
  client_context: z.object({
    timezone: z.string().optional(),
    locale: z.string().optional(),
  }).optional(),
});

// ========== BUSINESS CONFIG SCHEMAS ==========
export const businessConfigSchema = z.object({
  product_name: z.string().trim().max(200).optional(),
  product_description: z.string().trim().max(2000).optional(),
  base_price: z.number().min(0).max(1000000).optional(),
  currency: z.string().length(3).optional(),
  target_niche: z.string().trim().max(200).optional(),
  target_company_size: z.string().trim().max(100).optional(),
  target_location: z.string().trim().max(200).optional(),
  booking_link: z.string().url().max(500).optional().or(z.literal('')),
  stripe_payment_link: z.string().url().max(500).optional().or(z.literal('')),
  brand_voice: z.string().trim().max(1000).optional(),
  closing_style: z.enum(['consultative', 'direct', 'educational']).optional(),
});

// ========== POLICY SCHEMAS ==========
export const policyUpdateSchema = z.object({
  risk_defaults: z.object({
    personal: z.enum(['conservative', 'balanced', 'aggressive']),
    ops: z.enum(['conservative', 'balanced', 'aggressive']),
    marketing: z.enum(['conservative', 'balanced', 'aggressive']),
  }).optional(),
  runway: z.object({
    business_min_months: z.number().int().min(1).max(36),
    business_warn_months: z.number().int().min(1).max(48).optional(),
    business_growth_months: z.number().int().min(1).max(60).optional(),
  }).optional(),
  caps: z.object({
    max_experiment_spend_monthly: z.object({
      currency: z.literal('USD'),
      amount: z.number().min(0).max(100000),
    }).optional(),
    max_ad_spend_daily: z.object({
      currency: z.literal('USD'),
      amount: z.number().min(0).max(10000),
    }).optional(),
  }).optional(),
  non_negotiables: z.object({
    brand: z.array(z.string().max(200)).max(20).optional(),
  }).optional(),
});

// ========== ACTION SCHEMAS ==========
export const actionApprovalSchema = z.object({
  approve: z.literal(true),
  notes: z.string().trim().max(1000).optional(),
});

export const actionDenialSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(1000),
});

// ========== LEAD SCHEMAS ==========
export const leadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: emailSchema.optional(),
  phone: z.string().trim().max(30).optional(),
  source: z.string().trim().max(100).optional(),
  platform: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(5000).optional(),
});

// ========== WEBHOOK SCHEMAS ==========
export const webhookPayloadSchema = z.object({
  event_type: z.string(),
  data: z.record(z.unknown()),
  timestamp: z.string().datetime().optional(),
});

// ========== UTILITY FUNCTIONS ==========
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Validation failed: ${errors}`);
  }
  return result.data;
}

export type ValidationResult<T> = 
  | { success: true; data: T; errors?: never } 
  | { success: false; errors: string[]; data?: never };

export function validateSafe<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }
  return { success: true, data: result.data };
}
