"use client";

import {
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  MessageCircle,
  TrendingDown,
  TrendingUp,
  X,
  User,
  Bot,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useVapiAssistants,
  useVapiChatAnalytics,
} from "@/lib/analytics/useVapi";
import type { VapiChatSession, VapiChatMessage } from "@/lib/analytics/vapi";
import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { SiteHeader } from "@/components/site-header";

export default function ChatAnalyticsPage() {
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const [timeRange, setTimeRange] = useState("7d");
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [assistantFilter, setAssistantFilter] = useState("default");
  const [selectedSession, setSelectedSession] = useState<VapiChatSession | null>(null);

  if (!flagsLoading && !flags?.chat_analytics_enabled) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader title="AI Analytics – Chat" showAddButton={false} />
        <div className="flex-1 flex items-center justify-center p-8">
          <Alert className="max-w-md">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Denna funktion är inte tillgänglig. Kontakta administratören för att aktivera AI Analytics – Chat.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const now = new Date();
    const end = now.toISOString();
    let start: string;

    switch (timeRange) {
      case "24h":
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case "7d":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "30d":
        start = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString();
        break;
      case "90d":
        start = new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000,
        ).toISOString();
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    setStartDate(start);
    setEndDate(end);
  }, [timeRange]);

  const { assistants } = useVapiAssistants();
  const selectedAssistantId =
    assistantFilter === "default"
      ? undefined
      : assistantFilter === "all"
        ? "__all__"
        : assistantFilter;

  const { sessions, metrics, isLoading, error } = useVapiChatAnalytics({
    startDate,
    endDate,
    assistantId: selectedAssistantId,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {["total-conversations", "answered", "avg-messages", "meetings"].map(
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
            <MessageCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Kunde inte ladda Chat Analytics
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="font-medium">{error.message}</p>
                <div className="mt-3 space-y-2">
                  <p>Möjliga orsaker:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Vapi-integration är inte konfigurerad för din organisation</li>
                    <li>Vapi API-nyckel saknas eller är ogiltig</li>
                    <li>Vapi API svarar inte (timeout)</li>
                    <li>Chat-funktionen är inte aktiverad i Vapi</li>
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chat Analytics</h2>
          <p className="text-gray-600 mt-1">
            Insights into your chat widget performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <select
            value={assistantFilter}
            onChange={(e) => setAssistantFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors cursor-pointer"
          >
            <option value="default">Default Assistant</option>
            <option value="all">All Assistants</option>
            {assistants.map((assistant) => (
              <option key={assistant.id} value={assistant.id}>
                {assistant.name || assistant.id}
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors cursor-pointer"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Conversations
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalConversations || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics?.conversationChangePercent !== undefined ? (
                <>
                  {metrics.conversationChangePercent >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                  )}
                  <span
                    className={
                      metrics.conversationChangePercent >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {Math.abs(metrics.conversationChangePercent)}% from last
                    period
                  </span>
                </>
              ) : (
                <span>Chat conversations started</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Answered Conversations
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.answeredConversations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.answerRate !== undefined
                ? `${metrics.answerRate.toFixed(1)}% answer rate`
                : "No data yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Messages</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.averageMessagesPerConversation
                ? metrics.averageMessagesPerConversation.toFixed(1)
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Messages per conversation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Meetings Booked
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.meetingsBooked || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.conversionRate !== undefined
                ? `${metrics.conversionRate.toFixed(1)}% conversion rate`
                : "No conversions yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Volume Charts */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversations by Day</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  Daily conversation volume
                </p>
                {metrics?.conversationsByDay &&
                Object.keys(metrics.conversationsByDay).length > 0 ? (
                  <div className="text-xs mt-4 space-y-1">
                    {Object.entries(metrics.conversationsByDay)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 7)
                      .map(([day, count]) => (
                        <div key={day} className="flex justify-between gap-4">
                          <span>{day}:</span>
                          <span className="font-medium">{String(count)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    No data available
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation Status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  Status breakdown
                </p>
                {metrics?.statusDistribution &&
                Object.keys(metrics.statusDistribution).length > 0 ? (
                  <div className="text-xs space-y-1 mt-4">
                    {Object.entries(metrics.statusDistribution).map(
                      ([status, count]) => (
                        <div
                          key={status}
                          className="flex justify-between gap-4"
                        >
                          <span className="capitalize">{status}:</span>
                          <span className="font-medium">{String(count)}</span>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    No data available
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations List & Detail View */}
      <div className="grid gap-4 lg:grid-cols-2 h-[calc(100vh-300px)] min-h-[600px]">
        {/* Conversations List */}
        <Card className="flex flex-col h-full overflow-hidden border-border/50 shadow-sm">
          <CardHeader className="border-b bg-muted/30 py-4">
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span>Konversationer</span>
              <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-1 rounded-full border">
                {sessions.length} totalt
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">Inga konversationer hittades för denna period.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {sessions.map((session) => {
                  const firstUserMessage = session.messages?.find((m: VapiChatMessage) => m.role === "user");
                  const rawPreview = firstUserMessage?.content || session.metadata?.input || "Ingen förhandsvisning";
                  const messagePreview = typeof rawPreview === "string" ? rawPreview : String(rawPreview || "Ingen förhandsvisning");
                  const isSelected = selectedSession?.id === session.id;
                  
                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full text-left px-4 py-4 hover:bg-muted/50 transition-all flex items-start gap-3 group ${
                        isSelected ? "bg-muted border-l-2 border-primary pl-[14px]" : "pl-4 border-l-2 border-transparent"
                      }`}
                    >
                      <div className={`flex-shrink-0 mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border ${
                        session.status === "completed" ? "bg-green-50 border-green-100 text-green-600" : 
                        session.status === "abandoned" ? "bg-red-50 border-red-100 text-red-600" : "bg-gray-50 border-gray-100 text-gray-500"
                      }`}>
                        {session.status === "completed" ? <CheckCircle className="w-5 h-5" /> :
                         session.status === "abandoned" ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {assistants.find((a) => a.id === session.assistantId)?.name || "AI Assistent"}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                            {new Date(session.startTime).toLocaleDateString("sv-SE", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        
                        <p className={`text-sm truncate line-clamp-1 ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"}`}>
                          {messagePreview}
                        </p>
                        
                        <div className="flex items-center gap-2 pt-1">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            session.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : 
                            session.status === "abandoned" ? "bg-red-50 text-red-700 border-red-200" : 
                            "bg-gray-50 text-gray-700 border-gray-200"
                          }`}>
                            {session.status === "completed" ? "Slutförd" : 
                             session.status === "abandoned" ? "Avbruten" : session.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {session.messageCount || session.messages?.length || 0}
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

        {/* Conversation Detail View */}
        <Card className="flex flex-col h-full overflow-hidden border-border/50 shadow-sm">
          <CardHeader className="border-b bg-muted/30 py-4 h-[69px] flex justify-center">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="font-semibold text-base">Konversation</span>
              </div>
              {selectedSession && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedSession(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            {!selectedSession ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/20">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">Ingen konversation vald</h3>
                <p className="text-sm text-muted-foreground">
                  Välj en konversation från listan till vänster för att se detaljerna
                </p>
              </div>
            ) : (
              <>
                {/* Session Info Bar */}
                <div className="bg-muted/30 border-b px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Assistent</span>
                    <span className="font-medium truncate">
                      {assistants.find((a) => a.id === selectedSession.assistantId)?.name || "Okänd"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Tidpunkt</span>
                    <span className="font-medium truncate">
                      {new Date(selectedSession.startTime).toLocaleString("sv-SE", {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Status</span>
                    <span className={`font-medium px-1.5 py-0.5 rounded-md inline-flex w-fit items-center gap-1 ${
                      selectedSession.status === "completed" ? "bg-green-50 text-green-700" : 
                      selectedSession.status === "abandoned" ? "bg-red-50 text-red-700" : "bg-gray-100"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedSession.status === "completed" ? "bg-green-500" : 
                        selectedSession.status === "abandoned" ? "bg-red-500" : "bg-gray-500"
                      }`} />
                      {selectedSession.status === "completed" ? "Slutförd" : 
                       selectedSession.status === "abandoned" ? "Avbruten" : selectedSession.status}
                    </span>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/20">
                  {selectedSession.messages && selectedSession.messages.length > 0 ? (
                    selectedSession.messages.map((message, idx) => {
                      const isUser = message.role === "user";
                      return (
                        <div
                          key={message.id || idx}
                          className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isUser && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mt-1">
                              <Bot className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          
                          <div className={`flex flex-col max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
                            <div className={`relative px-4 py-2.5 shadow-sm text-sm ${
                              isUser 
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
                                : "bg-background border text-foreground rounded-2xl rounded-tl-sm"
                            }`}>
                              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                              {isUser ? "Användare" : "AI Assistent"}
                            </span>
                          </div>

                          {isUser && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 mt-1">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Inga meddelanden tillgängliga för denna konversation.
                      </p>
                      {selectedSession.metadata?.input && (
                        <Card className="w-full max-w-md bg-muted/30">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Startad med input</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm font-medium">{selectedSession.metadata.input}</p>
                          </CardContent>
                        </Card>
                      )}
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
