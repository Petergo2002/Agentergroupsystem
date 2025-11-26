"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckCircle,
  Loader2,
  MessageCircle,
  Minimize2,
  Send,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createSupabaseClient } from "@/lib/supabase";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  functionCalled?: string;
  functionResult?: string;
  error?: boolean;
  requireConfirmation?: boolean;
  pendingAction?: {
    functionName: string;
    args: any;
    tool_call_id?: string;
  };
  executed?: boolean;
}

export function AiWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createSupabaseClient(), []);

  const getWelcomeMessage = (): Message => ({
    id: "1",
    content:
      "Hej! Jag är din AI-assistent. Jag kan hjälpa dig skapa kontakter, boka möten, skapa uppgifter och mycket mer. Vad kan jag hjälpa dig med?",
    role: "assistant",
    timestamp: new Date(),
  });

  // Load user-specific chat history and listen for auth changes
  useEffect(() => {
    const loadUserAndMessages = async (currentUser: any) => {
      if (currentUser) {
        // Load user-specific messages from localStorage
        const storageKey = `chat_messages_${currentUser.id}`;
        const savedMessages = localStorage.getItem(storageKey);

        if (savedMessages) {
          try {
            const parsedMessages = JSON.parse(savedMessages).map(
              (msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              }),
            );
            setMessages(parsedMessages);
          } catch (error) {
            console.error("Error parsing saved messages:", error);
            // Set welcome message if parsing fails
            const welcomeMessage: Message = {
              id: "1",
              content:
                "Hej! Jag är din AI-assistent. Jag kan hjälpa dig skapa kontakter, boka möten, skapa uppgifter och mycket mer. Vad kan jag hjälpa dig med?",
              role: "assistant",
              timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
          }
        } else {
          // Set initial welcome message for this user
          const welcomeMessage: Message = {
            id: "1",
            content:
              "Hej! Jag är din AI-assistent. Jag kan hjälpa dig skapa kontakter, boka möten, skapa uppgifter och mycket mer. Vad kan jag hjälpa dig med?",
            role: "assistant",
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
        }
      } else {
        setMessages([]);
      }
    };

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        console.log("Initial session:", session?.user?.email);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserAndMessages(session.user);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log("Auth state change:", event, session?.user?.email);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserAndMessages(session.user);
        } else {
          setMessages([]);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth.onAuthStateChange]);

  const newChat = () => {
    if (!user) return;
    const storageKey = `chat_messages_${user.id}`;
    const initial = [getWelcomeMessage()];
    setMessages(initial);
    localStorage.setItem(storageKey, JSON.stringify(initial));
  };

  const deleteChat = () => {
    if (!user) return;
    if (
      !window.confirm("Vill du radera denna chatt? Detta går inte att ångra.")
    )
      return;
    const storageKey = `chat_messages_${user.id}`;
    localStorage.removeItem(storageKey);
    setMessages([getWelcomeMessage()]);
  };

  // Save messages to localStorage when they change
  useEffect(() => {
    if (user && messages.length > 0) {
      const storageKey = `chat_messages_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, user]);

  const scrollAreaSelector = "[data-radix-scroll-area-viewport]";

  const confirmAction = async (message: Message) => {
    if (!message.pendingAction) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: message.pendingAction }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Något gick fel vid körning");

      // Mark the original summary as executed (optional)
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, executed: true } : m)),
      );

      const resultMsg: Message = {
        id: (Date.now() + 2).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
        functionCalled: data.functionCalled,
        functionResult: data.functionResult,
        error: data.error,
        executed: data.executed,
      };
      setMessages((prev) => [...prev, resultMsg]);
    } catch (e) {
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        content: `Kunde inte köra åtgärden: ${e instanceof Error ? e.message : "Okänt fel"}`,
        role: "assistant",
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const scrollContainer =
      scrollAreaRef.current.querySelector(scrollAreaSelector);
    if (!(scrollContainer instanceof HTMLElement)) return;
    if (messages.length === 0) return;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Check if user is logged in - refresh session if needed
    if (!user) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Continue with the message since user is actually logged in
        } else {
          const errorMessage: Message = {
            id: Date.now().toString(),
            content: "Du behöver vara inloggad för att använda chatbotten",
            role: "assistant",
            timestamp: new Date(),
            error: true,
          };
          setMessages((prev) => [...prev, errorMessage]);
          return;
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "Kunde inte verifiera inloggning. Försök igen.",
          role: "assistant",
          timestamp: new Date(),
          error: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare last 10 messages (role/content only) for short-term memory
      const history = messages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input.trim(), history }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Något gick fel");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
        functionCalled: data.functionCalled,
        functionResult: data.functionResult,
        error: data.error,
        requireConfirmation: data.requireConfirmation,
        pendingAction: data.pendingAction,
        executed: data.executed,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Tyvärr uppstod ett fel: ${error instanceof Error ? error.message : "Okänt fel"}`,
        role: "assistant",
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFunctionIcon = (functionName?: string) => {
    switch (functionName) {
      case "create_contact":
        return <User className="h-3 w-3" />;
      case "create_event":
        return <CheckCircle className="h-3 w-3" />;
      case "create_task":
        return <CheckCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getFunctionLabel = (functionName?: string) => {
    switch (functionName) {
      case "create_contact":
        return "Skapade kontakt";
      case "create_event":
        return "Bokade möte";
      case "create_task":
        return "Skapade uppgift";
      case "search_contacts":
        return "Sökte kontakter";
      case "get_upcoming_events":
        return "Hämtade möten";
      default:
        return "Utförde åtgärd";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <Card
              className={`w-80 shadow-xl border-2 ${isMinimized ? "h-14" : "h-96"} transition-all duration-300`}
            >
              <CardHeader className="pb-2 px-4 py-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Bot className="h-4 w-4 text-blue-600" />
                  AI Assistent
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={newChat}
                    className="h-6 px-2 text-xs"
                  >
                    Ny chatt
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteChat}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Ta bort
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-6 w-6 p-0"
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="flex-1 flex flex-col p-0 h-80">
                  <ScrollArea className="flex-1 px-3" ref={scrollAreaRef}>
                    <div className="space-y-3 pb-3">
                      <AnimatePresence>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className={`flex gap-2 ${
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            {message.role === "assistant" && (
                              <Avatar className="h-6 w-6 mt-1 flex-shrink-0">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  <Bot className="h-3 w-3" />
                                </AvatarFallback>
                              </Avatar>
                            )}

                            <div
                              className={`max-w-[75%] ${
                                message.role === "user" ? "order-first" : ""
                              }`}
                            >
                              <div
                                className={`rounded-lg px-2 py-1.5 text-xs ${
                                  message.role === "user"
                                    ? "bg-blue-600 text-white ml-auto"
                                    : message.error
                                      ? "bg-red-50 text-red-900 border border-red-200"
                                      : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                <div className="whitespace-pre-wrap">
                                  {message.content}
                                </div>

                                {message.functionCalled && (
                                  <div className="mt-1 pt-1 border-t border-gray-200/50">
                                    <div className="flex items-center gap-1 text-xs opacity-75">
                                      {getFunctionIcon(message.functionCalled)}
                                      <span>
                                        {getFunctionLabel(
                                          message.functionCalled,
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {message.role === "assistant" &&
                                  message.requireConfirmation &&
                                  !message.executed && (
                                    <div className="mt-2">
                                      <Button
                                        size="sm"
                                        className="h-6 text-xs px-2 py-0"
                                        onClick={() => confirmAction(message)}
                                      >
                                        Kör
                                      </Button>
                                    </div>
                                  )}
                              </div>

                              <div
                                className={`text-xs text-gray-500 mt-0.5 ${
                                  message.role === "user"
                                    ? "text-right"
                                    : "text-left"
                                }`}
                              >
                                {formatTime(message.timestamp)}
                              </div>
                            </div>

                            {message.role === "user" && (
                              <Avatar className="h-6 w-6 mt-1 flex-shrink-0">
                                <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                  <User className="h-3 w-3" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-2 justify-start"
                        >
                          <Avatar className="h-6 w-6 mt-1">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              <Bot className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-gray-100 rounded-lg px-2 py-1.5">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Tänker...
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="border-t p-3">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Skriv här..."
                        disabled={isLoading}
                        className="flex-1 h-8 text-xs"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button - Only show when widget is closed */}
      {!isOpen && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
