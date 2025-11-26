import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceClient } from "@/lib/supabase/service";

type ChatMessagePayload = {
  content: string;
  metadata?: Record<string, any>;
  sentAt?: string;
};

type RecordChatInteractionParams = {
  organizationId: string;
  assistantId?: string | null;
  userId?: string | null;
  source?: string;
  sessionId?: string | null;
  externalSessionId?: string | null;
  userMessage?: ChatMessagePayload;
  assistantMessage?: ChatMessagePayload;
  metadata?: Record<string, any>;
  startedAt?: string;
  endedAt?: string | null;
  status?: "active" | "completed" | "error";
};

type RecordCallSessionParams = {
  organizationId: string;
  assistantId?: string | null;
  userId?: string | null;
  source?: string;
  direction?: "inbound" | "outbound";
  status?: string;
  toNumber?: string | null;
  fromNumber?: string | null;
  durationSeconds?: number | null;
  providerCallId?: string | null;
  metadata?: Record<string, any>;
  startedAt?: string;
  endedAt?: string | null;
  cost?: number | null;
};

function toDateString(value?: string): string {
  if (!value) {
    return new Date().toISOString().split("T")[0]!;
  }
  return new Date(value).toISOString().split("T")[0]!;
}

async function recordUsageMetric(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    assistantId?: string | null;
    channel: "chat" | "call";
    metricDate: string;
    sessionDelta?: number;
    messageDelta?: number;
    durationDelta?: number;
  },
) {
  const assistantKey =
    params.assistantId && params.assistantId.trim().length > 0
      ? params.assistantId
      : "unassigned";
  try {
    await supabase.rpc("record_ai_usage_metric", {
      p_org_id: params.organizationId,
      p_assistant_id: assistantKey,
      p_channel: params.channel,
      p_metric_date: params.metricDate,
      p_session_inc: Math.max(params.sessionDelta ?? 0, 0),
      p_message_inc: Math.max(params.messageDelta ?? 0, 0),
      p_duration_inc: Math.max(params.durationDelta ?? 0, 0),
    });
  } catch (error) {
    console.warn("Failed to record AI usage metric", error);
  }
}

export async function recordChatInteraction(
  params: RecordChatInteractionParams,
): Promise<{ sessionId: string | null }> {
  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();
    const metricDate = toDateString(params.startedAt || now);
    const source = params.source || "system";
    const assistantId = params.assistantId ?? null;
    let createdNewSession = false;
    let sessionRow: {
      id: string;
      message_count: number | null;
    } | null = null;

    if (params.sessionId) {
      const { data } = await supabase
        .from("ai_chat_sessions")
        .select("id, message_count")
        .eq("id", params.sessionId)
        .maybeSingle();
      if (data) sessionRow = data;
    }

    if (!sessionRow && params.externalSessionId) {
      const { data } = await supabase
        .from("ai_chat_sessions")
        .select("id, message_count")
        .eq("organization_id", params.organizationId)
        .eq("external_session_id", params.externalSessionId)
        .maybeSingle();
      if (data) sessionRow = data;
    }

    if (!sessionRow) {
      const { data, error } = await supabase
        .from("ai_chat_sessions")
        .insert({
          organization_id: params.organizationId,
          user_id: params.userId ?? null,
          assistant_id: assistantId,
          session_source: source,
          external_session_id: params.externalSessionId ?? null,
          status: params.status ?? "active",
          started_at: params.startedAt ?? now,
          metadata: params.metadata ?? {},
        })
        .select("id, message_count")
        .single();

      if (error) throw error;
      sessionRow = data;
      createdNewSession = true;
    } else if (params.metadata) {
      await supabase
        .from("ai_chat_sessions")
        .update({ metadata: params.metadata })
        .eq("id", sessionRow.id);
    }

    const sessionId = sessionRow.id;
    const messagePayloads: any[] = [];

    if (params.userMessage?.content) {
      messagePayloads.push({
        session_id: sessionId,
        organization_id: params.organizationId,
        user_id: params.userId ?? null,
        assistant_id: assistantId,
        role: "user",
        content: params.userMessage.content,
        metadata: params.userMessage.metadata ?? {},
        source,
        created_at: params.userMessage.sentAt ?? now,
      });
    }

    if (params.assistantMessage?.content) {
      messagePayloads.push({
        session_id: sessionId,
        organization_id: params.organizationId,
        user_id: null,
        assistant_id: assistantId,
        role: "assistant",
        content: params.assistantMessage.content,
        metadata: params.assistantMessage.metadata ?? {},
        source,
        created_at: params.assistantMessage.sentAt ?? now,
      });
    }

    if (messagePayloads.length) {
      await supabase.from("ai_chat_messages").insert(messagePayloads);
    }

    const updatePayload: Record<string, any> = {
      last_message_at: now,
      updated_at: now,
    };

    if (messagePayloads.length) {
      updatePayload.message_count =
        (sessionRow.message_count ?? 0) + messagePayloads.length;
    }

    if (params.status) {
      updatePayload.status = params.status;
    }

    if (params.endedAt) {
      updatePayload.ended_at = params.endedAt;
    } else if (params.status === "completed") {
      updatePayload.ended_at = now;
    }

    if (params.metadata) {
      updatePayload.metadata = params.metadata;
    }

    await supabase
      .from("ai_chat_sessions")
      .update(updatePayload)
      .eq("id", sessionId);

    await recordUsageMetric(supabase, {
      organizationId: params.organizationId,
      assistantId,
      channel: "chat",
      metricDate,
      sessionDelta: createdNewSession ? 1 : 0,
      messageDelta: messagePayloads.filter((msg) => msg.role !== "system")
        .length,
    });

    return { sessionId };
  } catch (error) {
    console.error("Failed to record chat interaction", error);
    return { sessionId: params.sessionId ?? null };
  }
}

export async function recordCallSession(
  params: RecordCallSessionParams,
): Promise<{ id: string } | null> {
  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();
    const startedAt = params.startedAt ?? now;
    const metricDate = toDateString(startedAt);
    const { data, error } = await supabase
      .from("ai_call_sessions")
      .insert({
        organization_id: params.organizationId,
        user_id: params.userId ?? null,
        assistant_id: params.assistantId ?? null,
        source: params.source ?? "system",
        direction: params.direction ?? "outbound",
        status: params.status ?? "queued",
        provider_call_id: params.providerCallId ?? null,
        from_number: params.fromNumber ?? null,
        to_number: params.toNumber ?? null,
        duration_seconds: params.durationSeconds ?? null,
        cost: params.cost ?? null,
        started_at: startedAt,
        ended_at: params.endedAt ?? null,
        metadata: params.metadata ?? {},
      })
      .select("id")
      .single();

    if (error) throw error;

    await recordUsageMetric(supabase, {
      organizationId: params.organizationId,
      assistantId: params.assistantId ?? null,
      channel: "call",
      metricDate,
      sessionDelta: 1,
      durationDelta: params.durationSeconds ?? 0,
    });

    return data;
  } catch (error) {
    console.error("Failed to record call session", error);
    return null;
  }
}
