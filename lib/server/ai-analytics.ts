import { createServiceClient } from "@/lib/supabase/service";

export type AiUsageFilters = {
  organizationId: string;
  assistantId?: string | null;
  channel?: "chat" | "call";
  startDate?: string;
  endDate?: string;
};

export async function getAiUsageMetrics(filters: AiUsageFilters) {
  const supabase = createServiceClient();
  let query = supabase
    .from("ai_usage_daily_metrics")
    .select(
      "metric_date, assistant_id, channel, session_count, message_count, duration_seconds",
    )
    .eq("organization_id", filters.organizationId)
    .order("metric_date", { ascending: true });

  if (filters.assistantId) {
    query = query.eq("assistant_id", filters.assistantId);
  }

  if (filters.channel) {
    query = query.eq("channel", filters.channel);
  }

  if (filters.startDate) {
    query = query.gte("metric_date", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("metric_date", filters.endDate);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load AI usage metrics: ${error.message}`);
  }

  const totals = {
    sessions: 0,
    messages: 0,
    durationSeconds: 0,
  };

  const byDate: Record<
    string,
    {
      sessions: number;
      messages: number;
      durationSeconds: number;
    }
  > = {};

  const byAssistant: Record<
    string,
    {
      chat: { sessions: number; messages: number; durationSeconds: number };
      call: { sessions: number; messages: number; durationSeconds: number };
    }
  > = {};

  for (const row of data ?? []) {
    totals.sessions += row.session_count ?? 0;
    totals.messages += row.message_count ?? 0;
    totals.durationSeconds += row.duration_seconds ?? 0;

    const dateKey = row.metric_date as string;
    if (!byDate[dateKey]) {
      byDate[dateKey] = { sessions: 0, messages: 0, durationSeconds: 0 };
    }
    byDate[dateKey].sessions += row.session_count ?? 0;
    byDate[dateKey].messages += row.message_count ?? 0;
    byDate[dateKey].durationSeconds += row.duration_seconds ?? 0;

    const assistantKey = row.assistant_id || "unassigned";
    if (!byAssistant[assistantKey]) {
      byAssistant[assistantKey] = {
        chat: { sessions: 0, messages: 0, durationSeconds: 0 },
        call: { sessions: 0, messages: 0, durationSeconds: 0 },
      };
    }

    const bucket = byAssistant[assistantKey][row.channel as "chat" | "call"];
    bucket.sessions += row.session_count ?? 0;
    bucket.messages += row.message_count ?? 0;
    bucket.durationSeconds += row.duration_seconds ?? 0;
  }

  return {
    rows: data ?? [],
    totals,
    byDate,
    byAssistant,
  };
}
