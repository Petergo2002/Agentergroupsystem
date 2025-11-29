import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Health Check Endpoint
 * Returns the health status of the application and its dependencies
 *
 * Usage:
 * - Monitoring tools (e.g., UptimeRobot, Pingdom)
 * - Load balancers
 * - Container orchestration (e.g., Kubernetes)
 *
 * Security: Uses anon key (not service role) for a lightweight connectivity check.
 * Does not expose any PII or sensitive data.
 */
export async function GET() {
  const startTime = Date.now();

  const health: {
    status: string;
    timestamp: string;
    uptime: number;
    environment: string | undefined;
    version: string;
    checks: {
      database: { status: string; responseTime: number; error?: string };
      api: { status: string; responseTime: number };
      config: { status: string; error?: string };
    };
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "0.1.0",
    checks: {
      database: { status: "unknown", responseTime: 0 },
      api: { status: "healthy", responseTime: 0 },
      config: { status: "unknown" },
    },
  };

  // Check environment configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    health.checks.config = {
      status: "unhealthy",
      error: "Missing Supabase configuration",
    };
    health.status = "unhealthy";

    // In production, this is a critical failure
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(health, {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }
  } else {
    health.checks.config = { status: "healthy" };
  }

  // Check database connection using anon key (not service role)
  // This is a lightweight check that doesn't bypass RLS
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const dbStartTime = Date.now();

      // Create a simple client with anon key for health check
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      });

      // Query organization_settings - a table with permissive read access
      // This verifies DB connectivity without needing service role
      const { error } = await supabase
        .from("organization_settings")
        .select("id")
        .limit(1);

      const dbResponseTime = Date.now() - dbStartTime;

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is fine for health check
        health.checks.database = {
          status: "unhealthy",
          responseTime: dbResponseTime,
          error: "Database query failed",
        };
        health.status = "degraded";
      } else {
        health.checks.database = {
          status: "healthy",
          responseTime: dbResponseTime,
        };
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Database connection failed";
      health.checks.database = {
        status: "unhealthy",
        responseTime: 0,
        error: errorMessage,
      };
      health.status = "unhealthy";
    }
  }

  // Calculate total response time
  const totalResponseTime = Date.now() - startTime;
  health.checks.api.responseTime = totalResponseTime;

  // Return appropriate status code
  const statusCode = health.status === "healthy" ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

/**
 * HEAD request for simple uptime checks
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
