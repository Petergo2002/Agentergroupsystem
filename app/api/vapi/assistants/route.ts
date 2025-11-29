import { type NextRequest, NextResponse } from "next/server";
import { getOrganizationVapiConfig } from "@/lib/server/vapi-org-config";

export async function GET(_req: NextRequest) {
  try {
    // Get Vapi config from user's organization (server-side only)
    const { vapi, config, error } = await getOrganizationVapiConfig();

    if (error || !vapi) {
      return NextResponse.json(
        {
          error: error || "AI integration not configured for your organization",
        },
        { status: 400 },
      );
    }

    // Fetch assistants using organization's Vapi config
    const assistants = await vapi.getAssistants();

    // Return clean data without exposing Vapi internals
    return NextResponse.json({
      assistants: assistants.map((assistant) => ({
        id: assistant.id,
        name: assistant.name,
        description: assistant.description,
        status: assistant.status,
        createdAt: assistant.createdAt,
        updatedAt: assistant.updatedAt,
      })),
      defaults: {
        chat: config?.default_chat_assistant_id || null,
        call: config?.default_call_assistant_id || null,
      },
    });
  } catch (e: any) {
    console.error("Error fetching AI assistants:", e);
    const msg = e?.message || "Failed to fetch AI assistants";
    const status = /401|403|404/.test(String(e?.status))
      ? Number(e.status)
      : 500;
    return NextResponse.json({ error: msg }, { status: status || 500 });
  }
}
