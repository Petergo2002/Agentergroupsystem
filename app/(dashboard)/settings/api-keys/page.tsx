"use client";

import { useEffect, useState } from "react";
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

// Types matching API
type ApiKey = {
  id: string;
  prefix: string;
  last4: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  rl_window_s?: number | null;
  rl_max?: number | null;
  webhook_url?: string | null;
};

type CreateState = {
  scopes: string[];
  rl_window_s: number;
  rl_max: number;
  webhook_url: string;
};

const ALL_SCOPES = [
  "contacts:create",
  "events:read",
  "events:create",
  "events:update",
  "events:delete",
];

export default function ApiKeysSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [createState, setCreateState] = useState<CreateState>({
    scopes: [...ALL_SCOPES],
    rl_window_s: 60,
    rl_max: 60,
    webhook_url: "",
  });

  // Per-key edit state to avoid hooks inside loops
  type Edit = {
    rl_window_s: number;
    rl_max: number;
    webhook_url: string;
    scopes: string[];
  };
  const [edits, setEdits] = useState<{ [key: string]: Edit }>({});

  const loadKeys = async () => {
    try {
      const res = await fetch("/api/integrations/api-keys");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Kunde inte hämta nycklar");
      const list: ApiKey[] = json.keys || [];
      setKeys(list);
      // initialize edit states
      const next: Record<string, Edit> = {};
      for (const k of list) {
        next[k.id] = {
          rl_window_s: k.rl_window_s ?? 60,
          rl_max: k.rl_max ?? 60,
          webhook_url: k.webhook_url ?? "",
          scopes: Array.isArray(k.scopes) ? [...k.scopes] : [],
        };
      }
      setEdits(next);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Fel vid hämtning";
      toast.error(message);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async () => {
    try {
      setLoading(true);
      setCreatedApiKey(null);
      const body = {
        scopes: createState.scopes,
        rl_window_s: createState.rl_window_s,
        rl_max: createState.rl_max,
        webhook_url: createState.webhook_url || undefined,
      };
      const res = await fetch("/api/integrations/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Kunde inte skapa nyckel");
      setCreatedApiKey(json.apiKey);
      toast.success("Ny API-nyckel skapad");
      await loadKeys();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Fel vid skapande";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/integrations/api-keys/${id}/rotate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Rotation misslyckades");
      setCreatedApiKey(json.apiKey);
      toast.success("Nyckeln har roterats. Spara den nya nyckeln!");
      await loadKeys();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Fel vid rotation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      if (!confirm("Är du säker? Denna åtgärd går inte att ångra.")) return;
      setLoading(true);
      const res = await fetch(`/api/integrations/api-keys/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Kunde inte spärra nyckel");
      toast.success("Nyckeln är spärrad");
      await loadKeys();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Fel vid spärrning";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: ApiKey, changes: Partial<ApiKey>) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/integrations/api-keys/${key.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopes: changes.scopes ?? key.scopes,
          rl_window_s: changes.rl_window_s ?? key.rl_window_s ?? 60,
          rl_max: changes.rl_max ?? key.rl_max ?? 60,
          webhook_url: changes.webhook_url ?? key.webhook_url ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Kunde inte uppdatera nyckel");
      toast.success("Nyckeln uppdaterad");
      await loadKeys();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Fel vid uppdatering";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string | null) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success("Kopierad till urklipp");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API-nycklar</h1>
        <p className="text-gray-600 mt-1">
          Hantera nycklar för n8n-integration (HMAC, scopes, rate limit,
          webhooks)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skapa ny API-nyckel</CardTitle>
          <CardDescription>
            Välj behörigheter, rate limit och webhook-URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">
              Behörigheter
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_SCOPES.map((scope) => {
                const checked = createState.scopes.includes(scope);
                return (
                  <label
                    key={scope}
                    className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setCreateState((s) => ({
                          ...s,
                          scopes: e.target.checked
                            ? [...s.scopes, scope]
                            : s.scopes.filter((x) => x !== scope),
                        }));
                      }}
                    />
                    {scope}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="api-create-window"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Fönster (sekunder)
              </label>
              <Input
                id="api-create-window"
                type="number"
                min={1}
                value={createState.rl_window_s}
                onChange={(e) =>
                  setCreateState((s) => ({
                    ...s,
                    rl_window_s: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label
                htmlFor="api-create-max"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Max anrop per fönster
              </label>
              <Input
                id="api-create-max"
                type="number"
                min={1}
                value={createState.rl_max}
                onChange={(e) =>
                  setCreateState((s) => ({
                    ...s,
                    rl_max: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label
                htmlFor="api-create-webhook"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Webhook URL (valfri)
              </label>
              <Input
                id="api-create-webhook"
                placeholder="https://n8n.example.com/webhook/..."
                value={createState.webhook_url}
                onChange={(e) =>
                  setCreateState((s) => ({ ...s, webhook_url: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button disabled={loading} onClick={handleCreate}>
              {loading ? "Skapar..." : "Skapa API-nyckel"}
            </Button>
          </div>

          {createdApiKey && (
            <div className="mt-4 p-4 border rounded-md bg-yellow-50">
              <div className="text-sm font-medium text-yellow-800 mb-2">
                Visa en gång
              </div>
              <div className="flex items-center justify-between gap-3">
                <code className="text-xs break-all">{createdApiKey}</code>
                <Button variant="secondary" onClick={() => copy(createdApiKey)}>
                  Kopiera
                </Button>
              </div>
              <div className="text-xs text-yellow-700 mt-2">
                Spara nyckeln nu. Den visas inte igen.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Befintliga nycklar</CardTitle>
          <CardDescription>
            Rotera, uppdatera eller spärra nycklar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {keys.length === 0 && (
            <div className="text-sm text-gray-600">Inga nycklar än.</div>
          )}
          <div className="space-y-4">
            {keys.map((k) => {
              const revoked = !!k.revoked_at;
              const edit = edits[k.id] ?? {
                rl_window_s: 60,
                rl_max: 60,
                webhook_url: "",
                scopes: [],
              };
              return (
                <div key={k.id} className="border rounded-md p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {k.prefix}.••••{k.last4}
                      </div>
                      <div className="text-xs text-gray-500">
                        Skapad {new Date(k.created_at).toLocaleString("sv-SE")}{" "}
                        • Senast använd{" "}
                        {k.last_used_at
                          ? new Date(k.last_used_at).toLocaleString("sv-SE")
                          : "—"}{" "}
                        {revoked && "• Spärrad"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        disabled={revoked || loading}
                        onClick={() => handleRotate(k.id)}
                      >
                        Rotera
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={revoked || loading}
                        onClick={() => handleRevoke(k.id)}
                      >
                        Spärra
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      Scopes
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ALL_SCOPES.map((scope) => {
                        const checked = edit.scopes.includes(scope);
                        return (
                          <label
                            key={scope}
                            className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs"
                          >
                            <input
                              type="checkbox"
                              disabled={revoked}
                              checked={checked}
                              onChange={(e) => {
                                setEdits((prev) => ({
                                  ...prev,
                                  [k.id]: {
                                    ...edit,
                                    scopes: e.target.checked
                                      ? [...edit.scopes, scope]
                                      : edit.scopes.filter((x) => x !== scope),
                                  },
                                }));
                              }}
                            />
                            {scope}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <label
                        htmlFor={`api-key-window-${k.id}`}
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Fönster (sekunder)
                      </label>
                      <Input
                        id={`api-key-window-${k.id}`}
                        type="number"
                        min={1}
                        value={edit.rl_window_s}
                        disabled={revoked}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [k.id]: {
                              ...edit,
                              rl_window_s: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`api-key-max-${k.id}`}
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Max anrop per fönster
                      </label>
                      <Input
                        id={`api-key-max-${k.id}`}
                        type="number"
                        min={1}
                        value={edit.rl_max}
                        disabled={revoked}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [k.id]: { ...edit, rl_max: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`api-key-webhook-${k.id}`}
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Webhook URL
                      </label>
                      <Input
                        id={`api-key-webhook-${k.id}`}
                        placeholder="https://n8n.example.com/webhook/..."
                        value={edit.webhook_url}
                        disabled={revoked}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [k.id]: { ...edit, webhook_url: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      disabled={revoked || loading}
                      onClick={() =>
                        handleUpdate(k, {
                          rl_window_s: edit.rl_window_s,
                          rl_max: edit.rl_max,
                          webhook_url: edit.webhook_url,
                          scopes: edit.scopes,
                        })
                      }
                    >
                      Spara ändringar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
