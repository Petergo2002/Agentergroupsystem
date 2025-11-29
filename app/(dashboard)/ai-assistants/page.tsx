"use client";

// A7: Lazy load Vapi to reduce initial bundle size
// import Vapi from "@vapi-ai/web";

import {
  Loader2,
  Lock,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";

// A7: Dynamic import for Vapi
let VapiModule: typeof import("@vapi-ai/web") | null = null;
const loadVapi = async () => {
  if (!VapiModule) {
    VapiModule = await import("@vapi-ai/web");
  }
  return VapiModule.default;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VapiClient = {
  start: (assistantId: string) => Promise<unknown>;
  stop: () => void;
  on: (event: unknown, handler: (payload: unknown) => void) => unknown;
};

interface VapiAssistant {
  id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function UserAIAssistantsPage() {
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const [assistants, setAssistants] = useState<VapiAssistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [activeAssistant, setActiveAssistant] = useState<VapiAssistant | null>(
    null,
  );
  const [testMessages, setTestMessages] = useState<
    Array<{ id: string; role: "user" | "assistant"; content: string }>
  >([]);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [testError, setTestError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Voice test state
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const [voiceAssistant, setVoiceAssistant] = useState<VapiAssistant | null>(
    null,
  );
  const [vapiWebConfig, setVapiWebConfig] = useState<{
    publicKey: string;
    baseUrl: string;
  } | null>(null);
  const [vapiWebConfigError, setVapiWebConfigError] = useState<string | null>(
    null,
  );
  const [callStatus, setCallStatus] = useState<
    "idle" | "connecting" | "in_progress" | "ended"
  >("idle");
  const [voiceTranscripts, setVoiceTranscripts] = useState<
    Array<{ id: string; role: "user" | "assistant"; text: string }>
  >([]);
  const vapiClientRef = useRef<VapiClient | null>(null);

  useEffect(() => {
    loadAssistants();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testMessages]);

  // Initialize Vapi client when config is loaded
  useEffect(() => {
    if (vapiWebConfig && !vapiClientRef.current) {
      initializeVapiClient();
    }
  }, [vapiWebConfig]);

  if (!flagsLoading && !flags?.ai_assistant_enabled) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader title="AI-assistenter" showAddButton={false} />
        <div className="flex-1 flex items-center justify-center p-8">
          <Alert className="max-w-md">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Denna funktion är inte tillgänglig. Kontakta administratören för
              att aktivera AI-assistenter.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const loadAssistants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/assistants");
      const data = await response.json();

      if (!response.ok) {
        // If there's an error field, show it
        if (data.error) {
          setError(data.error);
          toast.error(data.error);
        } else {
          throw new Error("Failed to load AI assistants");
        }
        return;
      }

      // Set assistants (may be empty array)
      setAssistants(data.assistants || []);

      // Store info message if there's one
      if (data.message && (!data.assistants || data.assistants.length === 0)) {
        setInfoMessage(data.message);
      } else {
        setInfoMessage(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load AI assistants";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVapiWebConfig = async () => {
    try {
      const response = await fetch("/api/user/vapi-web-config");
      const data = await response.json();

      if (!response.ok) {
        setVapiWebConfigError(
          data.error || "Failed to load voice configuration",
        );
        return;
      }

      setVapiWebConfig({
        publicKey: data.publicKey,
        baseUrl: data.baseUrl,
      });
      setVapiWebConfigError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load voice configuration";
      setVapiWebConfigError(message);
    }
  };

  const initializeVapiClient = async () => {
    if (!vapiWebConfig || vapiClientRef.current) return;

    try {
      // A7: Dynamically load Vapi SDK
      const Vapi = await loadVapi();
      const vapi = new Vapi(vapiWebConfig.publicKey);

      // Set up event listeners
      vapi.on("call-start", () => {
        setCallStatus("in_progress");
        toast.success("Röstsamtal startat");
      });

      vapi.on("call-end", () => {
        setCallStatus("ended");
        toast.info("Röstsamtal avslutat");
      });

      vapi.on("message", (message) => {
        if (message.type === "transcript") {
          setVoiceTranscripts((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${prev.length}`,
              role: message.role,
              text: message.transcript,
            },
          ]);
        }
      });

      vapi.on("error", (error) => {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Vapi error:", error);
        toast.error(`Röstsamtal fel: ${message}`);
        setCallStatus("ended");
      });

      vapiClientRef.current = vapi as unknown as VapiClient;
    } catch (error) {
      console.error("Failed to initialize Vapi client:", error);
      toast.error("Kunde inte initiera röstklient");
    }
  };

  const resetTestSession = () => {
    setTestMessages([]);
    setConversationId(undefined);
    setTestInput("");
    setTestError(null);
  };

  const openTestDialog = (assistant: VapiAssistant) => {
    setActiveAssistant(assistant);
    resetTestSession();
    setTestDialogOpen(true);
  };

  const closeTestDialog = () => {
    setTestDialogOpen(false);
    setActiveAssistant(null);
    resetTestSession();
  };

  const openVoiceDialog = async (assistant: VapiAssistant) => {
    setVoiceAssistant(assistant);
    setVoiceTranscripts([]);
    setCallStatus("idle");

    // Load config if not already loaded
    if (!vapiWebConfig && !vapiWebConfigError) {
      await loadVapiWebConfig();
    }

    setVoiceDialogOpen(true);
  };

  const closeVoiceDialog = () => {
    // Stop call if in progress
    if (callStatus === "in_progress" && vapiClientRef.current) {
      vapiClientRef.current.stop();
    }

    setVoiceDialogOpen(false);
    setVoiceAssistant(null);
    setVoiceTranscripts([]);
    setCallStatus("idle");
  };

  const startVoiceCall = async () => {
    if (!voiceAssistant || !vapiWebConfig) {
      toast.error("Kunde inte starta röstsamtal");
      return;
    }

    // Initialize client if not already done
    if (!vapiClientRef.current) {
      initializeVapiClient();
    }

    if (!vapiClientRef.current) {
      toast.error("Röstklient inte initierad");
      return;
    }

    try {
      setCallStatus("connecting");
      await vapiClientRef.current.start(voiceAssistant.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to start voice call:", error);
      toast.error(`Kunde inte starta röstsamtal: ${message}`);
      setCallStatus("idle");
    }
  };

  const stopVoiceCall = () => {
    if (vapiClientRef.current) {
      vapiClientRef.current.stop();
    }
    setCallStatus("ended");
  };

  const handleSendTestMessage = async () => {
    if (!activeAssistant) return;
    const trimmed = testInput.trim();
    if (!trimmed) {
      setTestError("Skriv ett meddelande först");
      return;
    }

    const outgoingMessage = {
      id: `${Date.now()}-user`,
      role: "user" as const,
      content: trimmed,
    };

    setTestMessages((prev) => [...prev, outgoingMessage]);
    setTestInput("");
    setTestLoading(true);
    setTestError(null);

    try {
      const response = await fetch(
        `/api/user/assistants/${encodeURIComponent(activeAssistant.id)}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            conversationId,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error || "Misslyckades med att testa assistenten",
        );
      }

      if (data.sessionId) {
        setConversationId(data.sessionId);
      }
      if (data.reply) {
        setTestMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-assistant`,
            role: "assistant" as const,
            content: data.reply,
          },
        ]);
      } else {
        toast.info("Assistenten svarade inte med ett meddelande");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ett fel uppstod";
      setTestError(message);
    } finally {
      setTestLoading(false);
    }
  };

  const getAssistantIcon = () => {
    return <Sparkles className="h-5 w-5" />;
  };

  const LOADING_CARD_KEYS = [
    "assistant-card-1",
    "assistant-card-2",
    "assistant-card-3",
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LOADING_CARD_KEYS.map((key) => (
              <Skeleton key={key} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Fel vid laddning av AI-assistenter
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <Button
                onClick={loadAssistants}
                className="mt-4"
                variant="outline"
              >
                Försök igen
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Mina AI-assistenter</h1>
        <p className="text-gray-600 mb-6">
          Här kan du se och testa de AI-assistenter som är tilldelade till din
          organisation.
        </p>
      </div>

      {assistants.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Sparkles className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga assistenter tilldelade
              </h3>
              <p className="text-gray-500 mb-2">
                {infoMessage ||
                  "Din organisation har inga AI-assistenter tilldelade ännu."}
              </p>
              {!infoMessage?.includes("not configured") && (
                <p className="text-sm text-gray-400">
                  Kontakta din administratör för att få tillgång.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assistants.map((assistant) => (
            <Card
              key={assistant.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getAssistantIcon()}
                    <CardTitle className="text-lg">
                      {assistant.name || assistant.id}
                    </CardTitle>
                  </div>
                  {assistant.status && (
                    <Badge
                      variant={
                        assistant.status === "active" ? "default" : "secondary"
                      }
                    >
                      {assistant.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {assistant.description && (
                  <p className="text-sm text-gray-600">
                    {assistant.description}
                  </p>
                )}
                <div className="text-xs text-gray-500">
                  ID: {assistant.id.slice(0, 8)}...
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => openTestDialog(assistant)}
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chatta
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openVoiceDialog(assistant)}
                    className="flex-1"
                    disabled={!!vapiWebConfigError}
                    title={vapiWebConfigError || "Testa med röst"}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Ring
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={testDialogOpen}
        onOpenChange={(open) =>
          open ? setTestDialogOpen(true) : closeTestDialog()
        }
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Testa{" "}
              {activeAssistant?.name || activeAssistant?.id || "assistent"}
            </DialogTitle>
            <DialogDescription>
              Chatta med AI-assistenten för att se hur den fungerar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-72 overflow-y-auto rounded-lg border border-border/40 bg-muted/5 p-4 space-y-3">
              {testMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  Börja konversationen genom att skriva ett meddelande nedan.
                </p>
              ) : (
                testMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide opacity-60">
                        {message.role === "user"
                          ? "Du"
                          : activeAssistant?.name || "Assistent"}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            {testError && (
              <p className="text-sm text-red-500" role="alert">
                {testError}
              </p>
            )}
            <Textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Skriv ett meddelande..."
              disabled={!activeAssistant || testLoading}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSendTestMessage();
                }
              }}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {conversationId
                  ? `Session: ${conversationId.slice(0, 12)}...`
                  : "Ingen aktiv session"}
              </span>
              {testMessages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetTestSession}
                  disabled={testLoading}
                >
                  Starta om
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeTestDialog}>
              Stäng
            </Button>
            <Button
              type="button"
              onClick={handleSendTestMessage}
              disabled={!activeAssistant || testLoading || !testInput.trim()}
            >
              {testLoading ? "Skickar..." : "Skicka meddelande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voice Test Dialog */}
      <Dialog
        open={voiceDialogOpen}
        onOpenChange={(open) =>
          open ? setVoiceDialogOpen(true) : closeVoiceDialog()
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Rösttest -{" "}
              {voiceAssistant?.name || voiceAssistant?.id || "assistent"}
            </DialogTitle>
            <DialogDescription>
              Testa assistenten med röst direkt i webbläsaren. Mikrofon krävs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {vapiWebConfigError ? (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Rösttest inte tillgängligt
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{vapiWebConfigError}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Call Status */}
                <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-gray-50">
                  {callStatus === "idle" && (
                    <>
                      <Mic className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Redo att starta
                      </span>
                    </>
                  )}
                  {callStatus === "connecting" && (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-600">Ansluter...</span>
                    </>
                  )}
                  {callStatus === "in_progress" && (
                    <>
                      <Mic className="h-5 w-5 text-green-600 animate-pulse" />
                      <span className="text-sm text-green-600">
                        Samtal pågår
                      </span>
                    </>
                  )}
                  {callStatus === "ended" && (
                    <>
                      <MicOff className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Samtal avslutat
                      </span>
                    </>
                  )}
                </div>

                {/* Transcripts */}
                {voiceTranscripts.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      Transkript:
                    </div>
                    {voiceTranscripts.map((transcript) => (
                      <div
                        key={transcript.id}
                        className={`text-sm p-2 rounded ${
                          transcript.role === "user"
                            ? "bg-blue-100 text-blue-900 ml-4"
                            : "bg-white text-gray-900 mr-4"
                        }`}
                      >
                        <span className="font-medium">
                          {transcript.role === "user" ? "Du" : "Assistent"}:
                        </span>{" "}
                        {transcript.text}
                      </div>
                    ))}
                  </div>
                )}

                {/* Info */}
                {callStatus === "idle" && (
                  <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-lg">
                    💡 Klicka på "Starta rösttest" för att börja prata med
                    assistenten. Browsern kommer be om mikrofonåtkomst.
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeVoiceDialog}>
              Stäng
            </Button>
            {!vapiWebConfigError &&
              (callStatus === "idle" || callStatus === "ended" ? (
                <Button
                  type="button"
                  onClick={startVoiceCall}
                  disabled={!voiceAssistant}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Starta rösttest
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={stopVoiceCall}
                  disabled={callStatus === "connecting"}
                >
                  <MicOff className="h-4 w-4 mr-2" />
                  Avsluta samtal
                </Button>
              ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
