import { NextResponse } from "next/server";
import { Vapi } from "@/lib/analytics/vapi";

export async function GET(request: Request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get("apiKey");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 },
      );
    }

    // Initialize VAPI client
    const vapi = new Vapi({ apiKey });

    // Fetch call logs
    const callLogs = await vapi.getCallLogs({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    return NextResponse.json(callLogs);
  } catch (error) {
    console.error("[VAPI_ERROR]", error);

    // Log detailed error
    if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
      if ("stack" in error) {
        console.error(`Stack trace: ${error.stack}`);
      }
    } else {
      console.error("Unknown error type:", error);
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
