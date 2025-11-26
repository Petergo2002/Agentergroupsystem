import { z } from "zod";

/**
 * Validation schemas for API endpoints
 */

export const VapiConfigSchema = z.object({
  vapi_enabled: z.boolean().optional(),
  vapi_api_key: z.string().min(10).max(500).optional(),
  vapi_public_api_key: z.string().min(10).max(500).optional(),
  vapi_base_url: z.string().url().optional().or(z.literal("")),
  vapi_org_id: z.string().max(100).optional().or(z.literal("")),
});

export const ApiKeyCreateSchema = z.object({
  scopes: z.array(z.string()).optional(),
  rl_window_s: z.number().int().min(1).max(3600).optional(),
  rl_max: z.number().int().min(1).max(10000).optional(),
  webhook_url: z.string().url().optional().or(z.literal("")),
});

export const ChatMessageSchema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().max(100).optional(),
  assistantId: z.string().max(100).optional(),
});

export const WidgetConfigSchema = z.object({
  assistant_id: z.string().max(100).optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  welcome_message: z.string().max(500).optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  enabled: z.boolean().optional(),
});

/**
 * Validate and sanitize input
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      if (firstError) {
        return { 
          success: false, 
          error: `${firstError.path.join('.')}: ${firstError.message}` 
        };
      }
    }
    return { success: false, error: "Invalid input" };
  }
}
