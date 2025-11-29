import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { checkRateLimit, validateApiKey } from "@/lib/mcp/auth";
import {
  handleBookMeeting,
  handleCheckAvailability,
  handleCreateLead,
  handleGetPropertyDetails,
  handleSearchProperties,
} from "@/lib/mcp/handlers";
import { MCP_TOOLS } from "@/lib/mcp/tools";
import type { MCPError, MCPRequest, MCPResponse } from "@/lib/mcp/types";

/**
 * MCP Server Endpoint
 * Handles all MCP protocol requests from VAPI
 */
export async function POST(request: NextRequest) {
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get("authorization");
    logger.debug("MCP request received", { hasAuth: !!authHeader });

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Missing or invalid Authorization header");
      return createErrorResponse(
        -32600,
        "Missing or invalid Authorization header",
        null,
      );
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '
    logger.debug("API key extracted", { keyPrefix: apiKey.substring(0, 12) });

    // Validate API key
    const validatedKey = await validateApiKey(apiKey);
    if (!validatedKey) {
      logger.warn("Invalid API key", { keyPrefix: apiKey.substring(0, 12) });
      return createErrorResponse(-32600, "Invalid API key", null);
    }

    logger.debug("Valid API key", { userId: validatedKey.user_id });

    // Check rate limit
    const rateLimit = await checkRateLimit(validatedKey.id);
    if (!rateLimit.allowed) {
      return createErrorResponse(429, "Rate limit exceeded", null, {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      });
    }

    // Parse MCP request
    const mcpRequest: MCPRequest = await request.json();

    // Handle different MCP methods
    switch (mcpRequest.method) {
      case "initialize":
        // VAPI requires an initialize handshake
        return createSuccessResponse(
          {
            protocolVersion: "2025-03-26",
            capabilities: {
              tools: {},
              prompts: {},
              resources: {},
            },
            serverInfo: {
              name: "calendar-crm-mcp",
              version: "1.0.0",
            },
          },
          mcpRequest.id,
        );

      case "tools/list":
        return createSuccessResponse(
          {
            tools: MCP_TOOLS,
          },
          mcpRequest.id,
        );

      case "tools/call":
        return await handleToolCall(validatedKey.user_id, mcpRequest);

      case "ping":
        return createSuccessResponse({ status: "ok" }, mcpRequest.id);

      default:
        logger.warn("Unknown MCP method", { method: mcpRequest.method });
        return createErrorResponse(
          -32601,
          `Method not found: ${mcpRequest.method}`,
          mcpRequest.id,
        );
    }
  } catch (error: any) {
    logger.error("MCP Server Error", { error });
    return createErrorResponse(
      -32603,
      error.message || "Internal server error",
      null,
    );
  }
}

/**
 * Handle tool call requests
 */
async function handleToolCall(userId: string, request: MCPRequest) {
  const { name, arguments: args } = request.params || {};

  if (!name) {
    return createErrorResponse(-32602, "Missing tool name", request.id);
  }

  try {
    let result: any;

    switch (name) {
      case "search_properties":
        result = await handleSearchProperties(userId, args);
        break;

      case "get_property_details":
        result = await handleGetPropertyDetails(userId, args);
        break;

      case "create_lead":
        result = await handleCreateLead(userId, args);
        break;

      case "check_availability":
        result = await handleCheckAvailability(userId, args);
        break;

      case "book_meeting":
        result = await handleBookMeeting(userId, args);
        break;

      default:
        return createErrorResponse(-32601, `Unknown tool: ${name}`, request.id);
    }

    return createSuccessResponse(result, request.id);
  } catch (error: any) {
    logger.error("Tool execution error", { tool: name, error });
    return createErrorResponse(
      -32603,
      error.message || "Tool execution failed",
      request.id,
    );
  }
}

/**
 * Create a successful MCP response
 */
function createSuccessResponse(
  result: any,
  id?: string | number | null,
): NextResponse {
  const response: MCPResponse = {
    jsonrpc: "2.0",
    result,
    id: id ?? null,
  };
  return NextResponse.json(response);
}

/**
 * Create an error MCP response
 */
function createErrorResponse(
  code: number,
  message: string,
  id?: string | number | null,
  data?: any,
): NextResponse {
  const error: MCPError = {
    code,
    message,
    data,
  };
  const response: MCPResponse = {
    jsonrpc: "2.0",
    error,
    id: id ?? null,
  };
  return NextResponse.json(response, { status: code === 429 ? 429 : 200 });
}

/**
 * Handle OPTIONS for CORS
 * Dynamically validates origin against allowed list
 */
export async function OPTIONS(request: NextRequest) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) =>
    o.trim(),
  ) || ["http://localhost:3000"];
  const requestOrigin = request.headers.get("origin");

  // Only allow if origin is in the allowed list
  const origin =
    requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0] || "http://localhost:3000";

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
    },
  });
}
