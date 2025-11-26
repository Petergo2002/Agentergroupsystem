import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Health Check Endpoint
 * Returns the health status of the application and its dependencies
 *
 * Usage:
 * - Monitoring tools (e.g., UptimeRobot, Pingdom)
 * - Load balancers
 * - Container orchestration (e.g., Kubernetes)
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
    },
  };

  // Check database connection
  try {
    const dbStartTime = Date.now();
    const supabase = createServiceClient();

    // Simple query to check database connectivity
    const { error } = await supabase
      .from("users")
      .select("id")
      .limit(1)
      .single();

    const dbResponseTime = Date.now() - dbStartTime;

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine for health check
      health.checks.database = {
        status: "unhealthy",
        responseTime: dbResponseTime,
        error: error.message,
      };
      health.status = "degraded";
    } else {
      health.checks.database = {
        status: "healthy",
        responseTime: dbResponseTime,
      };
    }
  } catch (error: any) {
    health.checks.database = {
      status: "unhealthy",
      responseTime: 0,
      error: error.message || "Database connection failed",
    };
    health.status = "unhealthy";
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
