import type { VapiCallLog } from "./vapi";

export interface CallMetrics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  averageDuration: number;
  totalDuration: number;
  callVolumeByHour: Record<string, number>;
  callVolumeByDay: Record<string, number>;
  callStatusDistribution: Record<string, number>;
  callChangePercent?: number;
  durationChangePercent?: number;
  successRate?: number;
  successRateChangePercent?: number;
  totalCost?: number;
  costChangePercent?: number;
  callVolume?: any;
  callStatus?: any;
}

export function processCallLogs(logs: VapiCallLog[]): CallMetrics {
  const metrics: CallMetrics = {
    totalCalls: logs.length,
    answeredCalls: 0,
    missedCalls: 0,
    averageDuration: 0,
    totalDuration: 0,
    callVolumeByHour: {},
    callVolumeByDay: {},
    callStatusDistribution: {},
  };

  if (logs.length === 0) {
    console.log("📞 No call logs to process");
    return metrics;
  }

  console.log(`📞 Processing ${logs.length} call logs for metrics`);

  // Calculate duration metrics
  logs.forEach((log: any, index) => {
    // Handle duration - Vapi returns seconds
    const duration = log.duration || 0;
    metrics.totalDuration += duration;

    // Handle status - Vapi uses "ended" for completed calls
    const status = log.status || "unknown";
    if (status === "ended" || status === "completed") {
      metrics.answeredCalls++;
    } else {
      metrics.missedCalls++;
    }

    // Get timestamp - Vapi uses createdAt or startedAt
    const timestamp =
      log.startTime || log.createdAt || log.startedAt || log.created_at;

    if (timestamp) {
      try {
        const date = new Date(timestamp);
        if (!Number.isNaN(date.getTime())) {
          // Group by hour
          const hour = date.getHours();
          metrics.callVolumeByHour[hour] =
            (metrics.callVolumeByHour[hour] || 0) + 1;

          // Group by day
          const day = date.toLocaleDateString("sv-SE");
          metrics.callVolumeByDay[day] =
            (metrics.callVolumeByDay[day] || 0) + 1;
        }
      } catch (_e) {
        console.warn(`Invalid timestamp for call ${log.id}:`, timestamp);
      }
    }

    // Status distribution
    metrics.callStatusDistribution[status] =
      (metrics.callStatusDistribution[status] || 0) + 1;

    // Debug log first few calls
    if (index < 3) {
      console.log(`  Call ${index + 1}:`, {
        id: log.id?.substring(0, 8),
        status,
        duration,
        timestamp,
        type: log.type,
      });
    }
  });

  // Calculate averages
  metrics.averageDuration =
    metrics.answeredCalls > 0
      ? metrics.totalDuration / metrics.answeredCalls
      : 0;

  console.log("📞 Final call metrics:", {
    totalCalls: metrics.totalCalls,
    answeredCalls: metrics.answeredCalls,
    totalDuration: metrics.totalDuration,
    daysWithData: Object.keys(metrics.callVolumeByDay).length,
  });

  return metrics;
}
