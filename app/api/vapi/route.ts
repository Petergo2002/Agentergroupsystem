import { NextResponse } from "next/server";
import { Vapi } from "@/lib/analytics/vapi";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get("apiKey");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // If no API key or demo key, return mock data for development
    if (!apiKey || apiKey === "demo-key") {
      const mockData = {
        totalCalls: 156,
        answeredCalls: 142,
        missedCalls: 14,
        averageDuration: 4.2,
        totalDuration: 655.2,
        totalCost: 23.45,
        callChangePercent: 12.5,
        durationChangePercent: -2.1,
        successRate: 91.0,
        successRateChangePercent: 3.2,
        costChangePercent: 8.7,
        callVolumeByHour: {
          "09": 12,
          "10": 18,
          "11": 22,
          "12": 15,
          "13": 20,
          "14": 25,
          "15": 19,
          "16": 16,
          "17": 9,
        },
        callVolumeByDay: {
          Monday: 32,
          Tuesday: 28,
          Wednesday: 35,
          Thursday: 31,
          Friday: 30,
        },
        callStatusDistribution: {
          completed: 142,
          busy: 8,
          "no-answer": 4,
          failed: 2,
        },
      };
      return NextResponse.json(mockData);
    }

    // Initialize VAPI client with options
    const vapi = new Vapi({
      apiKey,
      baseUrl: process.env.VAPI_BASE_URL,
    });

    // Set date range if provided
    const params: any = {};
    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) params.endDate = new Date(endDate).toISOString();

    // Fetch call logs
    const callLogs = await vapi.getCallLogs(params);

    // Process call logs into analytics data
    const analyticsData = {
      totalCalls: callLogs.length,
      answeredCalls: callLogs.filter((log) => log.status === "completed")
        .length,
      missedCalls: callLogs.filter((log) =>
        ["busy", "no-answer", "failed"].includes(log.status),
      ).length,
      averageDuration:
        callLogs.length > 0
          ? callLogs.reduce((sum, log) => sum + (log.duration || 0), 0) /
            callLogs.length /
            60 // Convert to minutes
          : 0,
      totalDuration: callLogs.reduce(
        (sum, log) => sum + (log.duration || 0),
        0,
      ),
      totalCost: callLogs.reduce((sum, log) => sum + (log.cost || 0), 0),
      callVolumeByHour: {},
      callVolumeByDay: {},
      callStatusDistribution: callLogs.reduce(
        (acc, log) => {
          acc[log.status] = (acc[log.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    logger.error("Error in VAPI analytics route:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
