import { type NextRequest, NextResponse } from "next/server";
import { processChatSessions } from "@/lib/analytics/vapiChatParser";
import { getOrganizationVapiConfig } from "@/lib/server/vapi-org-config";

export async function GET(req: NextRequest) {
  try {
    console.log("📊 Chat Analytics API called");
    
    // Get Vapi config from user's organization (server-side only)
    const { vapi, config, organizationId, error } = await getOrganizationVapiConfig();

    if (error || !vapi) {
      console.log("❌ Chat Analytics: No Vapi config", { error, organizationId });
      return NextResponse.json(
        {
          error: error || "AI integration not configured for your organization",
        },
        { status: 400 },
      );
    }

    console.log("✅ Chat Analytics: Vapi config loaded for org", organizationId);

    const { searchParams } = new URL(req.url);
    let startDate = searchParams.get("startDate") || undefined;
    let endDate = searchParams.get("endDate") || undefined;
    const requestedAssistant = searchParams.get("assistantId");
    
    // Only set assistantId if we have a valid value (not null, undefined, or empty string)
    let assistantId: string | undefined = undefined;
    if (requestedAssistant === "__all__") {
      assistantId = undefined; // Fetch all assistants
    } else if (requestedAssistant && requestedAssistant.trim()) {
      assistantId = requestedAssistant; // Use requested assistant
    } else if (config?.default_chat_assistant_id && config.default_chat_assistant_id.trim()) {
      assistantId = config.default_chat_assistant_id; // Use default if available
    }
    // Otherwise leave assistantId as undefined (fetch all chats)
    
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

    console.log("📊 Chat Analytics: Fetching sessions", {
      assistantId: assistantId || "(all)",
      startDate,
      endDate,
      limit,
    });

    // Fetch chat sessions using organization's Vapi config
    const allSessions = await vapi.getChatSessions({
      assistantId,
      limit,
    });
    
    console.log(`📊 Chat Analytics: Got ${allSessions.length} sessions from Vapi`);
    
    // Filter sessions by date range on server side
    const sessions = allSessions.filter((session) => {
      if (!startDate || !endDate) return true;
      try {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= new Date(startDate) && sessionDate <= new Date(endDate);
      } catch {
        return true; // Include sessions with invalid dates
      }
    });
    
    console.log(`📊 Chat Analytics: ${sessions.length} sessions after date filter`);
    
    const metrics = processChatSessions(sessions);

    console.log("📊 Chat Analytics: Response ready", {
      sessionsCount: sessions.length,
      totalConversations: metrics.totalConversations,
      answeredConversations: metrics.answeredConversations,
    });

    return NextResponse.json({ sessions, metrics });
  } catch (e: any) {
    console.error("❌ Error fetching chat analytics:", e);
    const msg = e?.message || "Failed to fetch chat analytics";
    const status = /401|403|404|400/.test(String(e?.status))
      ? Number(e.status)
      : 500;
    return NextResponse.json({ error: msg }, { status: status || 500 });
  }
}
