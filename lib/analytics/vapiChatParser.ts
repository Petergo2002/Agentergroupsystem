import type { VapiChatSession } from "./vapi";

export interface ChatMetrics {
  totalConversations: number;
  answeredConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  meetingsBooked: number;
  conversionRate: number;
  answerRate: number;
  conversationsByDay: Record<string, number>;
  conversationsByHour: Record<string, number>;
  statusDistribution: Record<string, number>;
  conversationChangePercent?: number;
  answerRateChangePercent?: number;
  conversionRateChangePercent?: number;
  // Additional metrics for debugging
  totalCost?: number;
  averageCostPerConversation?: number;
}

export function processChatSessions(sessions: VapiChatSession[]): ChatMetrics {
  const metrics: ChatMetrics = {
    totalConversations: sessions.length,
    answeredConversations: 0,
    totalMessages: 0,
    averageMessagesPerConversation: 0,
    meetingsBooked: 0,
    conversionRate: 0,
    answerRate: 0,
    conversationsByDay: {},
    conversationsByHour: {},
    statusDistribution: {},
    totalCost: 0,
    averageCostPerConversation: 0,
  };

  if (sessions.length === 0) {
    console.log("📊 No chat sessions to process");
    return metrics;
  }

  console.log(`📊 Processing ${sessions.length} chat sessions for metrics`);

  // Process each session
  sessions.forEach((session, index) => {
    // Count messages - handle both messageCount and messages array
    const messageCount = session.messageCount || session.messages?.length || 0;
    metrics.totalMessages += messageCount;

    // Check if conversation was answered (has at least one assistant message)
    const hasAssistantReply =
      session.messages?.some((m) => m.role === "assistant") || 
      messageCount > 1 ||
      session.status === "completed";
    
    if (hasAssistantReply) {
      metrics.answeredConversations++;
    }

    // Check for bookings/conversions
    if (
      session.hasBooking ||
      session.bookingId ||
      session.metadata?.hasBooking ||
      session.metadata?.booking_id
    ) {
      metrics.meetingsBooked++;
    }

    // Track costs if available
    if (session.metadata?.cost && typeof session.metadata.cost === "number") {
      metrics.totalCost = (metrics.totalCost || 0) + session.metadata.cost;
    }

    // Group by day - handle invalid dates gracefully
    try {
      const sessionDate = new Date(session.startTime);
      if (!isNaN(sessionDate.getTime())) {
        const day = sessionDate.toLocaleDateString("sv-SE");
        metrics.conversationsByDay[day] =
          (metrics.conversationsByDay[day] || 0) + 1;

        // Group by hour
        const hour = sessionDate.getHours();
        metrics.conversationsByHour[hour] =
          (metrics.conversationsByHour[hour] || 0) + 1;
      }
    } catch (e) {
      console.warn(`Invalid date for session ${session.id}:`, session.startTime);
    }

    // Status distribution
    const status = session.status || "unknown";
    metrics.statusDistribution[status] =
      (metrics.statusDistribution[status] || 0) + 1;

    // Debug log first few sessions
    if (index < 3) {
      console.log(`  Session ${index + 1}:`, {
        id: session.id?.substring(0, 8),
        messageCount,
        hasAssistantReply,
        status: session.status,
        startTime: session.startTime,
      });
    }
  });

  // Calculate averages and rates
  metrics.averageMessagesPerConversation =
    metrics.totalConversations > 0
      ? Math.round((metrics.totalMessages / metrics.totalConversations) * 10) / 10
      : 0;

  metrics.answerRate =
    metrics.totalConversations > 0
      ? Math.round((metrics.answeredConversations / metrics.totalConversations) * 1000) / 10
      : 0;

  metrics.conversionRate =
    metrics.totalConversations > 0
      ? Math.round((metrics.meetingsBooked / metrics.totalConversations) * 1000) / 10
      : 0;

  metrics.averageCostPerConversation =
    metrics.totalConversations > 0 && metrics.totalCost
      ? Math.round((metrics.totalCost / metrics.totalConversations) * 10000) / 10000
      : 0;

  console.log("📊 Final metrics:", {
    totalConversations: metrics.totalConversations,
    answeredConversations: metrics.answeredConversations,
    totalMessages: metrics.totalMessages,
    answerRate: metrics.answerRate,
    daysWithData: Object.keys(metrics.conversationsByDay).length,
  });

  return metrics;
}
