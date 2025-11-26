import { type NextRequest, NextResponse } from "next/server";
import { getOrganizationVapiConfig } from "@/lib/server/vapi-org-config";

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Vapi Debug API called");
    
    const { vapi, config, organizationId, userId, error } = await getOrganizationVapiConfig();

    if (error || !vapi) {
      return NextResponse.json({
        success: false,
        error,
        organizationId,
        userId,
        config: config ? {
          vapi_enabled: config.vapi_enabled,
          hasApiKey: !!config.vapi_api_key,
          hasPublicKey: !!config.vapi_public_api_key,
        } : null,
      });
    }

    // Try to fetch calls
    console.log("🔍 Testing Vapi call endpoint...");
    let callsResult: any = null;
    let callsError: string | null = null;
    
    try {
      const calls = await vapi.getCallLogs({ limit: 5 });
      callsResult = {
        count: calls.length,
        sample: calls.slice(0, 2).map((c: any) => ({
          id: c.id,
          status: c.status,
          startTime: c.startTime,
          createdAt: c.createdAt,
          startedAt: c.startedAt,
          type: c.type,
          duration: c.duration,
          allKeys: Object.keys(c),
        })),
        // Show raw first call for debugging
        rawFirst: calls[0],
      };
    } catch (e: any) {
      callsError = e.message;
    }

    // Try to fetch chats
    console.log("🔍 Testing Vapi chat endpoint...");
    let chatsResult: any = null;
    let chatsError: string | null = null;
    
    try {
      const chats = await vapi.getChatSessions({ limit: 5 });
      chatsResult = {
        count: chats.length,
        sample: chats.slice(0, 2).map((c: any) => ({
          id: c.id,
          status: c.status,
          startTime: c.startTime,
          messageCount: c.messageCount,
        })),
      };
    } catch (e: any) {
      chatsError = e.message;
    }

    // Try to fetch assistants
    console.log("🔍 Testing Vapi assistants endpoint...");
    let assistantsResult: any = null;
    let assistantsError: string | null = null;
    
    try {
      const assistants = await vapi.getAssistants();
      assistantsResult = {
        count: assistants.length,
        names: assistants.map((a: any) => a.name || a.id),
      };
    } catch (e: any) {
      assistantsError = e.message;
    }

    return NextResponse.json({
      success: true,
      organizationId,
      userId,
      config: {
        vapi_enabled: config?.vapi_enabled,
        hasApiKey: !!config?.vapi_api_key,
        hasPublicKey: !!config?.vapi_public_api_key,
        baseUrl: config?.vapi_base_url,
      },
      calls: callsError ? { error: callsError } : callsResult,
      chats: chatsError ? { error: chatsError } : chatsResult,
      assistants: assistantsError ? { error: assistantsError } : assistantsResult,
    });
  } catch (e: any) {
    console.error("❌ Vapi Debug error:", e);
    return NextResponse.json({
      success: false,
      error: e.message,
    }, { status: 500 });
  }
}
