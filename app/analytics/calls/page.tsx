"use client";

import {
  AlertOctagon,
  Calendar,
  Clock,
  Filter,
  Headphones,
  Phone,
  TrendingDown,
  TrendingUp,
  X,
  ChevronRight,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Play,
  Lock,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVapiAnalytics, useVapiAssistants } from "@/lib/analytics/useVapi";
import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { SiteHeader } from "@/components/site-header";

const RANGE_TO_DAYS: Record<string, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

interface CallLog {
  id: string;
  assistantId?: string;
  assistantName?: string;
  direction?: "inbound" | "outbound";
  status: string;
  duration?: number;
  startTime: string;
  endTime?: string;
  from?: string;
  to?: string;
  cost?: number;
  recordingUrl?: string;
  transcription?: string;
  summary?: string;
  analysis?: any;
}

export default function CallAnalyticsPage() {
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const [timeRange, setTimeRange] = useState<keyof typeof RANGE_TO_DAYS>("7d");
  const [assistantFilter, setAssistantFilter] = useState("all");
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  const endDate = useMemo(() => new Date().toISOString(), []);
  const startDate = useMemo(() => {
    const days = RANGE_TO_DAYS[timeRange] ?? 7;
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }, [timeRange]);

  if (!flagsLoading && !flags?.call_analytics_enabled) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader title="AI Analytics – Call" showAddButton={false} />
        <div className="flex-1 flex items-center justify-center p-8">
          <Alert className="max-w-md">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Denna funktion är inte tillgänglig. Kontakta administratören för att aktivera AI Analytics – Call.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Convert filter to assistantId for API
  const selectedAssistantId = assistantFilter === "all" ? "__all__" : assistantFilter;

  const { assistants } = useVapiAssistants();
  const { logs, metrics, isLoading, error } = useVapiAnalytics({
    startDate,
    endDate,
    assistantId: selectedAssistantId,
    limit: 200,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {["total-calls", "answered", "avg-duration", "total-cost"].map(
            (key) => (
              <Skeleton key={key} className="h-32 w-full rounded-lg" />
            ),
          )}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 border border-red-200 p-6">
          <div className="flex items-start">
            <AlertOctagon className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Kunde inte ladda Call Analytics
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="font-medium">{error.message}</p>
                <div className="mt-3 space-y-2">
                  <p>Möjliga orsaker:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Vapi-integration är inte konfigurerad för din organisation</li>
                    <li>Vapi API-nyckel saknas eller är ogiltig</li>
                    <li>Vapi API svarar inte (timeout)</li>
                  </ul>
                  <p className="mt-3">
                    Kontakta din administratör för att konfigurera Vapi-integration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl	font-bold tracking-tight">Call Analytics</h2>
          <p className="text-gray-600 mt-1">
            Detailed insights into your voice assistant performance
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <select
            value={assistantFilter}
            onChange={(e) => setAssistantFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors cursor-pointer"
          >
            <option value="all">All Assistants</option>
            {assistants.map((assistant) => (
              <option key={assistant.id} value={assistant.id}>
                {assistant.name || assistant.id}
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) =>
              setTimeRange(e.target.value as keyof typeof RANGE_TO_DAYS)
            }
            className="px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors cursor-pointer"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Calls"
          icon={<Phone className="h-4 w-4 text-muted-foreground" />}
          value={metrics?.totalCalls ?? 0}
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Answered Calls
            </CardTitle>
            <Phone className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.answeredCalls ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalCalls
                ? `${((metrics.answeredCalls / metrics.totalCalls) * 100).toFixed(1)}% answer rate`
                : "No calls yet"}
            </p>
          </CardContent>
        </Card>
        <MetricCard
          title="Avg. Duration"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          value={
            metrics?.averageDuration
              ? `${Math.round(metrics.averageDuration / 60)}m`
              : "0m"
          }
          positiveMeansUp
        />
        <MetricCard
          title="Total Duration"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          value={`${Math.round((metrics?.totalDuration || 0) / 60)}m`}
        />
      </div>

      {/* Volume & Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard
          title="Call Volume by Hour"
          icon={<Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />}
          description="Peak activity"
          values={metrics?.callVolumeByHour}
          formatter={(hour) => `${hour}:00`}
        />
        <InfoCard
          title="Call Status Distribution"
          icon={<Phone className="w-12 h-12 mx-auto mb-4 text-gray-400" />}
          description="Status breakdown"
          values={metrics?.callStatusDistribution}
          formatter={(status) => status}
        />
      </div>

      {/* Calls List & Detail View */}
      <div className="grid gap-4 lg:grid-cols-2 h-[calc(100vh-300px)] min-h-[600px]">
        {/* Calls List */}
        <Card className="flex flex-col h-full overflow-hidden border-border/50 shadow-sm">
          <CardHeader className="border-b bg-muted/30 py-4">
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span>Samtal</span>
              <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-1 rounded-full border">
                {logs.length} totalt
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                <Phone className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">Inga samtal hittades för denna period.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {logs.map((log: CallLog) => {
                  const isSelected = selectedCall?.id === log.id;
                  const durationMin = Math.round((log.duration || 0) / 60);
                  
                  return (
                    <button
                      key={log.id}
                      onClick={() => setSelectedCall(log)}
                      className={`w-full text-left px-4 py-4 hover:bg-muted/50 transition-all flex items-start gap-3 group ${
                        isSelected ? "bg-muted border-l-2 border-primary pl-[14px]" : "pl-4 border-l-2 border-transparent"
                      }`}
                    >
                      <div className={`flex-shrink-0 mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border ${
                        log.status === "ended" || log.status === "completed" ? "bg-green-50 border-green-100 text-green-600" : 
                        log.status === "failed" || log.status === "no-answer" ? "bg-red-50 border-red-100 text-red-600" : "bg-gray-50 border-gray-100 text-gray-500"
                      }`}>
                        {log.direction === "inbound" ? (
                          <PhoneIncoming className="w-5 h-5" />
                        ) : (
                          <PhoneOutgoing className="w-5 h-5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {log.direction === "inbound" ? (log.from || "Okänt nummer") : (log.to || "Okänt nummer")}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                            {new Date(log.startTime).toLocaleDateString("sv-SE", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        
                        <p className={`text-sm truncate line-clamp-1 ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"}`}>
                          {assistants.find((a) => a.id === log.assistantId)?.name || "AI Assistent"}
                        </p>
                        
                        <div className="flex items-center gap-2 pt-1">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            log.status === "ended" || log.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : 
                            log.status === "failed" || log.status === "no-answer" ? "bg-red-50 text-red-700 border-red-200" : 
                            "bg-gray-50 text-gray-700 border-gray-200"
                          }`}>
                            {log.status === "ended" || log.status === "completed" ? "Slutförd" : 
                             log.status === "failed" ? "Misslyckad" : 
                             log.status === "no-answer" ? "Inget svar" : log.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {durationMin} min
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call Detail View */}
        <Card className="flex flex-col h-full overflow-hidden border-border/50 shadow-sm">
          <CardHeader className="border-b bg-muted/30 py-4 h-[69px] flex justify-center">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span className="font-semibold text-base">Samtalsdetaljer</span>
              </div>
              {selectedCall && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedCall(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            {!selectedCall ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/20">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Phone className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">Inget samtal valt</h3>
                <p className="text-sm text-muted-foreground">
                  Välj ett samtal från listan till vänster för att se detaljerna
                </p>
              </div>
            ) : (
              <>
                {/* Call Info Bar */}
                <div className="bg-muted/30 border-b px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Riktning</span>
                    <span className="font-medium truncate flex items-center gap-1">
                      {selectedCall.direction === "inbound" ? (
                        <>
                          <PhoneIncoming className="w-3 h-3" />
                          Inkommande
                        </>
                      ) : (
                        <>
                          <PhoneOutgoing className="w-3 h-3" />
                          Utgående
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Längd</span>
                    <span className="font-medium truncate">
                      {Math.round((selectedCall.duration || 0) / 60)} min
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Status</span>
                    <span className={`font-medium px-1.5 py-0.5 rounded-md inline-flex w-fit items-center gap-1 ${
                      selectedCall.status === "ended" || selectedCall.status === "completed" ? "bg-green-50 text-green-700" : 
                      selectedCall.status === "failed" || selectedCall.status === "no-answer" ? "bg-red-50 text-red-700" : "bg-gray-100"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedCall.status === "ended" || selectedCall.status === "completed" ? "bg-green-500" : 
                        selectedCall.status === "failed" || selectedCall.status === "no-answer" ? "bg-red-500" : "bg-gray-500"
                      }`} />
                      {selectedCall.status === "ended" || selectedCall.status === "completed" ? "Slutförd" : 
                       selectedCall.status === "failed" ? "Misslyckad" : 
                       selectedCall.status === "no-answer" ? "Inget svar" : selectedCall.status}
                    </span>
                  </div>
                </div>

                {/* Call Details Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                  {/* Additional Call Info */}
                  <Card className="bg-background">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Samtalsinformation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Från:</span>
                        <span className="font-medium">{selectedCall.from || "Okänt"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Till:</span>
                        <span className="font-medium">{selectedCall.to || "Okänt"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Assistent:</span>
                        <span className="font-medium">
                          {assistants.find((a) => a.id === selectedCall.assistantId)?.name || selectedCall.assistantId || "Okänd"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Startad:</span>
                        <span>{new Date(selectedCall.startTime).toLocaleString("sv-SE")}</span>
                      </div>
                      {selectedCall.endTime && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avslutad:</span>
                          <span>{new Date(selectedCall.endTime).toLocaleString("sv-SE")}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recording */}
                  {selectedCall.recordingUrl && (
                    <Card className="bg-background">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Inspelning
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <audio controls className="w-full" src={selectedCall.recordingUrl}>
                          Din webbläsare stödjer inte ljuduppspelning.
                        </audio>
                      </CardContent>
                    </Card>
                  )}

                  {/* Summary */}
                  {selectedCall.summary && (
                    <Card className="bg-background">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Sammanfattning</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedCall.summary}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Transcription */}
                  {selectedCall.transcription && (
                    <Card className="bg-background">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Transkription</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-[200px] overflow-y-auto">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedCall.transcription}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!selectedCall.recordingUrl && !selectedCall.summary && !selectedCall.transcription && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-sm text-muted-foreground">
                        Ingen inspelning eller transkription tillgänglig för detta samtal.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  icon,
  value,
  change,
  reverseColor = false,
  positiveMeansUp = true,
}: {
  title: string;
  icon: ReactNode;
  value: string | number;
  change?: number;
  reverseColor?: boolean;
  positiveMeansUp?: boolean;
}) {
  const isPositive = change !== undefined && change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const positiveClass = reverseColor ? "text-red-600" : "text-green-600";
  const negativeClass = reverseColor ? "text-green-600" : "text-red-600";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {change === undefined ? (
            <AlertOctagon className="w-3 h-3 mr-1 text-gray-400" />
          ) : (
            <TrendIcon
              className={`w-3 h-3 mr-1 ${isPositive === positiveMeansUp ? positiveClass : negativeClass}`}
            />
          )}
          <span
            className={
              change === undefined
                ? ""
                : isPositive === positiveMeansUp
                  ? positiveClass
                  : negativeClass
            }
          >
            {change !== undefined
              ? `${Math.abs(change)}% from last period`
              : "No change data"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoCard({
  title,
  icon,
  description,
  values,
  formatter,
}: {
  title: string;
  icon: ReactNode;
  description: string;
  values?: Record<string, number>;
  formatter: (key: string) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            {icon}
            <p className="text-sm text-muted-foreground">{description}</p>
            {values && Object.keys(values).length > 0 ? (
              <div className="text-xs mt-4 space-y-1">
                {Object.entries(values)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([key, count]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <span>{formatter(key)}</span>
                      <span className="font-medium">{String(count)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">No data</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
