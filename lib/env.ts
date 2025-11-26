import { z } from "zod";

/**
 * Environment variable schema validation
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Supabase Configuration (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "Supabase service role key is required")
    .optional(),

  // Google OAuth (Optional)
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),

  // Webhook Configuration (Optional)
  WEBHOOK_SIGNING_SECRET: z.string().optional(),

  // OpenAI (Optional)
  OPENAI_API_KEY: z.string().optional(),

  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Client-side environment variables
 * Only includes NEXT_PUBLIC_* variables that are safe to expose
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
});

/**
 * Validate and parse environment variables
 * Throws an error if validation fails
 */
function validateEnv() {
  // Server-side validation
  if (typeof window === "undefined") {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
      console.error(
        "❌ Invalid environment variables:",
        parsed.error.flatten().fieldErrors,
      );
      throw new Error("Invalid environment variables");
    }

    return parsed.data;
  }

  // Client-side validation (only public vars)
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  });

  if (!parsed.success) {
    console.error(
      "❌ Invalid client environment variables:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid client environment variables");
  }

  return parsed.data;
}

/**
 * Validated environment variables
 * Use this instead of process.env for type safety
 */
export const env = validateEnv();

/**
 * Type-safe environment variable access
 */
export type Env = z.infer<typeof envSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Check if running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Check if running in production mode
 */
export const isProduction = process.env.NODE_ENV === "production";

/**
 * Check if running in test mode
 */
export const isTest = process.env.NODE_ENV === "test";
