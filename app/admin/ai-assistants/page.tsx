"use client";

import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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

interface VapiAssistant {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

interface Organization {
  id: string;
  name: string;
  vapi_enabled: boolean;
  vapi_api_key?: string;
  vapi_public_api_key?: string;
  has_vapi_key?: boolean;
  vapi_key_last4?: string;
}

interface OrganizationWithAssistants extends Organization {
  assistants?: VapiAssistant[];
  loadingAssistants?: boolean;
}

export default function AIAssistantsAdminPage() {
  const [organizations, setOrganizations] = useState<
    OrganizationWithAssistants[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vapiDialogOpen, setVapiDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [vapiApiKeyInput, setVapiApiKeyInput] = useState("");
  const [vapiPublicKeyInput, setVapiPublicKeyInput] = useState("");
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/vapi/assistants");
      if (!response.ok) throw new Error("Failed to load organizations");

      const data = await response.json();
      const orgs = data.organizations || [];

      setOrganizations(
        orgs.map((org: Organization) => ({
          ...org,
          assistants: [],
          loadingAssistants: false,
        })),
      );

      // Note: We can't automatically load assistants anymore since we don't expose
      // full API keys for security. Assistants will be loaded on-demand when needed.
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ett fel uppstod";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrgAssistants = async (orgId: string) => {
    setOrganizations((prev) =>
      prev.map((org) =>
        org.id === orgId ? { ...org, loadingAssistants: true } : org,
      ),
    );

    try {
      const response = await fetch(
        `/api/admin/organizations/${orgId}/assistants`,
      );

      if (!response.ok) {
        const data = await response.json();
        // If Vapi not configured, just show empty list
        if (data.message) {
          setOrganizations((prev) =>
            prev.map((org) =>
              org.id === orgId
                ? { ...org, assistants: [], loadingAssistants: false }
                : org,
            ),
          );
          return;
        }
        throw new Error("Failed to load assistants");
      }

      const data = await response.json();

      setOrganizations((prev) =>
        prev.map((o) =>
          o.id === orgId
            ? {
                ...o,
                assistants: data.assistants || [],
                loadingAssistants: false,
              }
            : o,
        ),
      );
    } catch (err: unknown) {
      console.error("Error loading assistants for org:", err);
      setOrganizations((prev) =>
        prev.map((org) =>
          org.id === orgId
            ? { ...org, assistants: [], loadingAssistants: false }
            : org,
        ),
      );
    }
  };

  const openVapiDialog = async (org: Organization) => {
    setSelectedOrg(org);
    setVapiApiKeyInput("");
    setVapiPublicKeyInput("");

    // Always fetch current config to show masked keys (even if not enabled yet)
    try {
      const response = await fetch(
        `/api/admin/organizations/${org.id}/vapi-config`,
      );
      if (response.ok) {
        const config = await response.json();
        // Update selected org with masked keys for display
        setSelectedOrg({
          ...org,
          vapi_api_key: config.vapi_api_key,
          vapi_public_api_key: config.vapi_public_api_key,
        });
      }
    } catch (err) {
      console.error("Error fetching VAPI config:", err);
    }

    setVapiDialogOpen(true);
  };

  const closeVapiDialog = () => {
    setVapiDialogOpen(false);
    setSelectedOrg(null);
    setVapiApiKeyInput("");
    setVapiPublicKeyInput("");
  };

  const activateVapi = async () => {
    if (!selectedOrg) {
      toast.error("Ingen organisation vald");
      return;
    }

    // If updating existing config, allow empty fields (keep existing keys)
    // If activating new, require API key
    if (!selectedOrg.vapi_enabled && !vapiApiKeyInput.trim()) {
      toast.error("VAPI API-nyckel krävs för aktivering");
      return;
    }

    setActivating(true);
    try {
      const updateData: {
        vapi_enabled: boolean;
        vapi_api_key?: string;
        vapi_public_api_key?: string;
      } = {
        vapi_enabled: true,
      };

      // Only include keys if they were changed (not empty)
      if (vapiApiKeyInput.trim()) {
        updateData.vapi_api_key = vapiApiKeyInput.trim();
      }
      if (vapiPublicKeyInput.trim()) {
        updateData.vapi_public_api_key = vapiPublicKeyInput.trim();
      }

      const response = await fetch(
        `/api/admin/organizations/${selectedOrg.id}/vapi-config`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to activate VAPI");
      }

      const message = selectedOrg.vapi_enabled
        ? `VAPI-konfiguration uppdaterad för ${selectedOrg.name}! ✅`
        : `VAPI aktiverat för ${selectedOrg.name}! 🎉`;
      toast.success(message);
      closeVapiDialog();
      loadOrganizations();
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Ett fel uppstod";
      toast.error(errMessage);
    } finally {
      setActivating(false);
    }
  };

  const deactivateVapi = async (orgId: string, orgName: string) => {
    if (
      !confirm(`Är du säker på att du vill inaktivera VAPI för ${orgName}?`)
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/organizations/${orgId}/vapi-config`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vapi_enabled: false,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to deactivate VAPI");

      toast.success(`VAPI inaktiverat för ${orgName}`);
      loadOrganizations();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ett fel uppstod";
      toast.error(message);
    }
  };

  const stats = {
    total: organizations.length,
    enabled: organizations.filter((o) => o.vapi_enabled).length,
    disabled: organizations.filter((o) => !o.vapi_enabled).length,
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI-Assistenter</h1>
        <p className="text-muted-foreground mt-2">
          Hantera VAPI-integration för dina kunder
        </p>
      </div>

      {/* Översikt */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Totalt antal kunder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              VAPI Aktiverat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.enabled}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utan VAPI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {stats.disabled}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kunder */}
      <Card>
        <CardHeader>
          <CardTitle>Kunder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizations.map((org) => (
              <Card key={org.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      🏢 {org.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {org.vapi_enabled ? (
                        <Badge variant="default" className="bg-green-600">
                          ✅ VAPI Aktiverat
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          ❌ VAPI Inte aktiverat
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {org.vapi_enabled ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openVapiDialog(org)}
                        >
                          ⚙️ Hantera
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => deactivateVapi(org.id, org.name)}
                        >
                          🗑️ Inaktivera
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => openVapiDialog(org)}
                      >
                        ⚡ Aktivera VAPI
                      </Button>
                    )}
                  </div>
                </div>

                {org.vapi_enabled && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Assistenter ({org.assistants?.length || 0})
                      </h4>
                      {!org.loadingAssistants &&
                        org.assistants?.length === 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => loadOrgAssistants(org.id)}
                          >
                            🔄 Ladda assistenter
                          </Button>
                        )}
                    </div>
                    {org.loadingAssistants ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Hämtar assistenter...
                      </div>
                    ) : org.assistants && org.assistants.length > 0 ? (
                      <div className="grid gap-2">
                        {org.assistants.map((assistant) => (
                          <div
                            key={assistant.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <div className="font-medium">
                                {assistant.name || assistant.id}
                              </div>
                              {assistant.description && (
                                <div className="text-sm text-muted-foreground">
                                  {assistant.description}
                                </div>
                              )}
                            </div>
                            {assistant.status && (
                              <Badge variant="outline">
                                {assistant.status}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        Inga assistenter hittades
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
          {organizations.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              Inga kunder hittades
            </p>
          )}
        </CardContent>
      </Card>

      {/* VAPI Dialog */}
      <Dialog
        open={vapiDialogOpen}
        onOpenChange={(open) =>
          open ? setVapiDialogOpen(true) : closeVapiDialog()
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedOrg?.vapi_enabled ? "Hantera" : "Aktivera"} VAPI för{" "}
              {selectedOrg?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedOrg?.vapi_enabled
                ? "Uppdatera VAPI API-nyckeln för denna kund."
                : "Klistra in VAPI API-nyckeln från kundens VAPI-organisation."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="vapi-api-key">
                VAPI API-nyckel (Server)
              </label>
              {selectedOrg?.vapi_api_key && (
                <div className="flex items-center gap-2 mb-2 text-xs text-green-600">
                  ✓ Nyckel sparad (slutar på:{" "}
                  {selectedOrg.vapi_api_key.slice(-4)})
                </div>
              )}
              <Textarea
                id="vapi-api-key"
                value={vapiApiKeyInput}
                onChange={(e) => setVapiApiKeyInput(e.target.value)}
                placeholder={
                  selectedOrg?.vapi_api_key
                    ? "Lämna tomt för att behålla nuvarande nyckel, eller klistra in ny nyckel..."
                    : "Klistra in VAPI server API-nyckel här..."
                }
                rows={3}
                className="font-mono text-sm mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                💡 Server-nyckel för backend-anrop (börjar med vk_...)
              </p>
            </div>
            <div>
              <label
                className="text-sm font-medium"
                htmlFor="vapi-public-api-key"
              >
                VAPI Public API-nyckel (Valfritt)
              </label>
              {selectedOrg?.vapi_public_api_key && (
                <div className="flex items-center gap-2 mb-2 text-xs text-green-600">
                  ✓ Nyckel sparad (slutar på:{" "}
                  {selectedOrg.vapi_public_api_key.slice(-4)})
                </div>
              )}
              <Textarea
                id="vapi-public-api-key"
                value={vapiPublicKeyInput}
                onChange={(e) => setVapiPublicKeyInput(e.target.value)}
                placeholder={
                  selectedOrg?.vapi_public_api_key
                    ? "Lämna tomt för att behålla nuvarande nyckel, eller klistra in ny nyckel..."
                    : "Klistra in VAPI public API-nyckel här..."
                }
                rows={3}
                className="font-mono text-sm mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                🎤 För web-röst och widgets (börjar med pk_...)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeVapiDialog}>
              Avbryt
            </Button>
            <Button
              type="button"
              onClick={activateVapi}
              disabled={
                activating ||
                (!selectedOrg?.vapi_enabled && !vapiApiKeyInput.trim())
              }
            >
              {activating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {selectedOrg?.vapi_enabled ? "Uppdaterar..." : "Aktiverar..."}
                </>
              ) : selectedOrg?.vapi_enabled ? (
                "Uppdatera"
              ) : (
                "Aktivera VAPI"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
