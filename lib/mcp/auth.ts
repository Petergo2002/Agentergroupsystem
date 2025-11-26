import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import type { ValidatedApiKey } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
}

if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is not defined. Please add it to your .env.local file",
  );
}

/**
 * Validates an API key and returns the associated user information
 * Uses service role to bypass RLS
 */
export async function validateApiKey(
  apiKey: string,
): Promise<ValidatedApiKey | null> {
  if (!apiKey || !apiKey.startsWith("vapi_")) {
    return null;
  }

  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  // Extract prefix (first 12 chars)
  const prefix = apiKey.substring(0, 12);

  // Hash the full key for comparison
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

  // Look up the API key
  const { data, error } = await supabase
    .from("api_keys")
    .select(
      "id, user_id, prefix, scopes, vapi_assistant_id, is_active, revoked_at",
    )
    .eq("prefix", prefix)
    .eq("secret_hash", keyHash)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if key is active and not revoked
  if (!data.is_active || data.revoked_at) {
    return null;
  }

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return {
    id: data.id,
    user_id: data.user_id,
    prefix: data.prefix,
    scopes: data.scopes || [],
    vapi_assistant_id: data.vapi_assistant_id,
  };
}

/**
 * Check rate limit for an API key
 */
export async function checkRateLimit(keyId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: string;
}> {
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  const { data, error } = await supabase.rpc("api_key_rate_check", {
    p_key_id: keyId,
  });

  if (error || !data || data.length === 0) {
    // Default to allowing if rate limit check fails
    return {
      allowed: true,
      remaining: 60,
      resetAt: new Date(Date.now() + 60000).toISOString(),
    };
  }

  const result = data[0];
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetAt: result.reset_at,
  };
}

/**
 * Generate a new API key for a user
 */
export async function generateApiKey(
  userId: string,
  description?: string,
): Promise<{
  apiKey: string;
  prefix: string;
}> {
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  // Generate random API key. Prefer the Postgres helper, but fall back to Node
  // crypto if the function/extension is unavailable (e.g. pgcrypto missing).
  let apiKey: string | null = null;
  try {
    const { data: keyData, error: rpcError } =
      await supabase.rpc("generate_api_key");

    if (rpcError) {
      throw rpcError;
    }

    if (typeof keyData !== "string" || !keyData) {
      throw new Error("No API key returned from database function");
    }

    apiKey = keyData;
  } catch (rpcError) {
    const message =
      rpcError instanceof Error ? rpcError.message : String(rpcError);
    console.warn(
      "[generateApiKey] Falling back to Node crypto because generate_api_key RPC failed:",
      message,
    );
    apiKey = `vapi_${crypto.randomBytes(32).toString("hex")}`;
  }

  if (!apiKey) {
    throw new Error("Unable to generate API key");
  }

  // Extract prefix
  const prefix = apiKey.substring(0, 12);

  // Hash the key
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

  // Store in database
  const { error } = await supabase.from("api_keys").insert({
    user_id: userId,
    prefix,
    secret_hash: keyHash,
    salt: "", // Not used with SHA256
    last4: apiKey.slice(-4),
    scopes: ["vapi:read", "vapi:write"],
    description: description || "API Integration Key",
    is_active: true,
  });

  if (error) {
    console.error("Database error inserting API key:", error);
    throw new Error(`Failed to store API key: ${error.message}`);
  }

  return { apiKey, prefix };
}
