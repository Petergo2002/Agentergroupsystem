import { type NextRequest, NextResponse } from "next/server";
import { processCallLogs } from "@/lib/analytics/vapiParser";
import { getOrganizationVapiConfig } from "@/lib/server/vapi-org-config";

export async function GET(req: NextRequest) {
  try {
    console.log("📞 Call Analytics API called");

    // Get Vapi config from user's organization (server-side only)
    const { vapi, organizationId, error } = await getOrganizationVapiConfig();

    if (error || !vapi) {
      console.log("❌ Call Analytics: No Vapi config", {
        error,
        organizationId,
      });
      return NextResponse.json(
        {
          error: error || "AI integration not configured for your organization",
        },
        { status: 400 },
      );
    }

    console.log(
      "✅ Call Analytics: Vapi config loaded for org",
      organizationId,
    );

    const { searchParams } = new URL(req.url);
    let startDate = searchParams.get("startDate") || undefined;
    let endDate = searchParams.get("endDate") || undefined;
    const requestedAssistant = searchParams.get("assistantId");

    // Only set assistantId if we have a valid value
    let assistantId: string | undefined;
    if (requestedAssistant === "__all__") {
      assistantId = undefined; // Fetch all assistants
    } else if (requestedAssistant?.trim()) {
      assistantId = requestedAssistant;
    }

    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : 100; // Default to 100 to get more data

    // Default to last 30 days if no range provided (increased from 7)
    if (!startDate || !endDate) {
      const now = new Date();
      const end = now.toISOString();
      const start = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      startDate = startDate || start;
      endDate = endDate || end;
    }

    console.log("📞 Call Analytics: Fetching logs", {
      assistantId: assistantId || "(all)",
      startDate,
      endDate,
      limit,
    });

    // Fetch call logs using organization's Vapi config
    const rawLogs = await vapi.getCallLogs({ assistantId, limit });

    console.log(`📞 Call Analytics: Got ${rawLogs.length} logs from Vapi`);

    // Normalize logs to ensure consistent field names
    const normalizedLogs = rawLogs.map((log: any) => ({
      ...log,
      // Normalize timestamp fields
      startTime:
        log.startTime || log.createdAt || log.startedAt || log.created_at,
      endTime: log.endTime || log.endedAt || log.ended_at,
      // Normalize other fields
      duration: log.duration || 0,
      status: log.status || "unknown",
      direction:
        log.type === "inboundPhoneCall"
          ? "inbound"
          : log.type === "outboundPhoneCall"
            ? "outbound"
            : log.type === "webCall"
              ? "web"
              : log.type,
      from: log.customer?.number || log.phoneNumber?.number || log.from,
      to: log.phoneNumber?.number || log.to,
      cost: log.cost,
      recordingUrl: log.recordingUrl || log.artifact?.recordingUrl,
      transcription: log.transcript || log.artifact?.transcript,
      summary: log.summary || log.analysis?.summary || log.artifact?.summary,
    }));

    // Filter logs by date range on server side
    const logs = normalizedLogs.filter((log: any) => {
      if (!startDate || !endDate) return true;
      try {
        const logDate = new Date(log.startTime);
        return logDate >= new Date(startDate) && logDate <= new Date(endDate);
      } catch {
        return true; // Include logs with invalid dates
      }
    });

    console.log(`📞 Call Analytics: ${logs.length} logs after date filter`);

    const metrics = processCallLogs(logs);

    console.log("📞 Call Analytics: Response ready", {
      logsCount: logs.length,
      totalCalls: metrics.totalCalls,
      answeredCalls: metrics.answeredCalls,
    });

    return NextResponse.json({ logs, metrics });
  } catch (e: any) {
    console.error("❌ Error fetching call analytics:", e);
    const msg = e?.message || "Failed to fetch call analytics";
    const status = /401|403|404|400/.test(String(e?.status))
      ? Number(e.status)
      : 500;
    return NextResponse.json({ error: msg }, { status: status || 500 });
  }
}
