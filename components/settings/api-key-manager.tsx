"use client";

import { Copy, Key, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseClient } from "@/lib/supabase";

interface ApiKey {
  id: string;
  prefix: string;
  last4: string;
  description: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [_revealedKey, _setRevealedKey] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const loadApiKeys = useCallback(async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("api_keys")
        .select(
          "id, prefix, last4, description, created_at, last_used_at, is_active",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      console.error("Error loading API keys:", error);
      toast.error("Kunde inte ladda API-nycklar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const createApiKey = async () => {
    if (!newKeyDescription.trim()) {
      toast.error("Vänligen ange en beskrivning");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newKeyDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Failed to create API key";
        console.error("API Error:", errorMsg, data);
        throw new Error(errorMsg);
      }

      const { apiKey, prefix } = data;

      if (!apiKey) {
        throw new Error("No API key returned from server");
      }

      setNewlyCreatedKey(apiKey);
      setNewKeyDescription("");
      toast.success("API-nyckel skapad!");

      await loadApiKeys();
    } catch (error: any) {
      console.error("Error creating API key:", error);
      toast.error(error.message || "Kunde inte skapa API-nyckel");
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm("Är du säker på att du vill återkalla denna API-nyckel?")) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to revoke API key");
      }

      toast.success("API-nyckel återkallad");
      await loadApiKeys();
    } catch (error: any) {
      console.error("Error revoking API key:", error);
      toast.error("Kunde inte återkalla API-nyckel");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopierat till urklipp!");
  };

  if (loading) {
    return <div>Laddar...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-white">API-nycklar</CardTitle>
          <CardDescription className="text-gray-300">
            Skapa och hantera API-nycklar för att ansluta din röstassistent till
            CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create new key */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Beskrivning (t.ex. 'VAPI Production')"
                value={newKeyDescription}
                onChange={(e) => setNewKeyDescription(e.target.value)}
              />
            </div>
            <Button onClick={createApiKey} disabled={creating}>
              <Plus className="w-4 h-4 mr-2" />
              Skapa nyckel
            </Button>
          </div>

          {/* Show newly created key */}
          {newlyCreatedKey && (
            <Card className="border-green-500 bg-green-50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label className="text-green-800 font-semibold">
                    ⚠️ Spara denna nyckel nu - den visas bara en gång!
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newlyCreatedKey}
                      readOnly
                      className="font-mono text-sm bg-white"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(newlyCreatedKey)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewlyCreatedKey(null)}
                  >
                    Jag har sparat nyckeln
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing keys */}
          <div className="space-y-2">
            <Label>Aktiva API-nycklar</Label>
            {apiKeys.length === 0 ? (
              <p className="text-sm text-gray-500">
                Inga API-nycklar skapade än
              </p>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((key) => (
                  <Card
                    key={key.id}
                    className={!key.is_active ? "opacity-50" : ""}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              {key.description}
                            </span>
                            {!key.is_active && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Återkallad
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            <span className="font-mono">
                              {key.prefix}...{key.last4}
                            </span>
                            <span className="mx-2">•</span>
                            Skapad:{" "}
                            {new Date(key.created_at).toLocaleDateString(
                              "sv-SE",
                            )}
                            {key.last_used_at && (
                              <>
                                <span className="mx-2">•</span>
                                Senast använd:{" "}
                                {new Date(key.last_used_at).toLocaleDateString(
                                  "sv-SE",
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {key.is_active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => revokeApiKey(key.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
