"use client";

import {
  CheckCircle,
  Eye,
  EyeOff,
  Save,
  TestTube,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface VapiConfig {
  vapi_enabled: boolean;
  vapi_api_key: string | null;
  vapi_public_api_key: string | null;
  vapi_base_url: string | null;
  vapi_org_id: string | null;
  default_chat_assistant_id: string | null;
  default_call_assistant_id: string | null;
}

interface VapiConfigManagerProps {
  organizationId: string;
  initialConfig: VapiConfig;
  onConfigUpdate?: (config: VapiConfig) => void;
}

export function VapiConfigManager({
  organizationId,
  initialConfig,
  onConfigUpdate,
}: VapiConfigManagerProps) {
  const [config, setConfig] = useState<VapiConfig>(initialConfig);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [assistants, setAssistants] = useState<
    Array<{
      id: string;
      name?: string;
      description?: string;
      status?: string;
    }>
  >([]);

  const persistConfig = async (
    nextConfig: VapiConfig,
    successMessage?: string,
  ) => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/vapi-config`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextConfig),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.needsMigration) {
          throw new Error(`${error.error}: ${error.details}`);
        }
        throw new Error(error.error || "Failed to update Vapi configuration");
      }

      const updatedConfig = await response.json();
      setConfig(updatedConfig);
      onConfigUpdate?.(updatedConfig);
      toast.success(successMessage || "Vapi configuration saved successfully");
      return updatedConfig;
    } catch (error: any) {
      toast.error(error.message || "Failed to save configuration");
      console.error("Error saving Vapi config:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    await persistConfig(config);
  };

  const handleTest = async () => {
    if (!config.vapi_api_key) {
      toast.error("API key is required for testing");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/vapi-config/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vapi_api_key: config.vapi_api_key,
            vapi_base_url: config.vapi_base_url,
            vapi_org_id: config.vapi_org_id,
          }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Connection successful! Found ${result.assistants?.length || 0} assistants.`,
        });
        setAssistants(result.assistants ?? []);
        toast.success("Vapi connection test successful");
      } else {
        setTestResult({
          success: false,
          message: result.error || "Connection failed",
        });
        setAssistants([]);
        toast.error("Vapi connection test failed");
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Connection test failed",
      });
      setAssistants([]);
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const updateConfig = (field: keyof VapiConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setTestResult(null); // Clear test result when config changes
    if (
      [
        "vapi_api_key",
        "vapi_public_api_key",
        "vapi_base_url",
        "vapi_org_id",
      ].includes(field)
    ) {
      setAssistants([]);
    }
  };

  const handleAssistantAssign = async (
    field: "default_chat_assistant_id" | "default_call_assistant_id",
    assistantId: string,
  ) => {
    const nextConfig = { ...config, [field]: assistantId };
    setConfig(nextConfig);
    await persistConfig(
      nextConfig,
      `Assigned ${assistantId} as default ${field === "default_chat_assistant_id" ? "chat" : "call"} assistant`,
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">AI Integration (Vapi)</CardTitle>
            <CardDescription className="text-gray-300">
              Configure AI voice and chat assistants for this organization
            </CardDescription>
          </div>
          <Badge variant={config.vapi_enabled ? "default" : "secondary"}>
            {config.vapi_enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5">
          <div>
            <Label className="text-white font-medium">
              Enable AI Integration
            </Label>
            <p className="text-sm text-gray-400 mt-1">
              Allow this organization to use AI assistants for calls and chat
            </p>
          </div>
          <Switch
            checked={config.vapi_enabled}
            onCheckedChange={(checked: boolean) =>
              updateConfig("vapi_enabled", checked)
            }
          />
        </div>

        {config.vapi_enabled && (
          <>
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="vapi-key" className="text-white">
                Vapi API Key *
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="vapi-key"
                    type={showApiKey ? "text" : "password"}
                    value={config.vapi_api_key || ""}
                    onChange={(e) =>
                      updateConfig("vapi_api_key", e.target.value)
                    }
                    placeholder="vk_live_... or server key"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <Button
                  onClick={handleTest}
                  disabled={testing || !config.vapi_api_key}
                  variant="outline"
                  size="sm"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testing ? "Testing..." : "Test"}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Use a server API key with permissions for assistants, calls, and
                chat
              </p>
            </div>

            {/* Public API Key */}
            <div className="space-y-2">
              <Label htmlFor="vapi-public-key" className="text-white">
                Vapi Public API Key
              </Label>
              <div className="relative flex-1">
                <Input
                  id="vapi-public-key"
                  type={showPublicKey ? "text" : "password"}
                  value={config.vapi_public_api_key || ""}
                  onChange={(e) =>
                    updateConfig("vapi_public_api_key", e.target.value)
                  }
                  placeholder="pk_live_... (for widgets)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPublicKey(!showPublicKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPublicKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Optional publishable key for embedding chat widgets or
                client-side SDKs
              </p>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`p-3 rounded-lg border ${
                  testResult.success
                    ? "border-green-500/20 bg-green-500/10"
                    : "border-red-500/20 bg-red-500/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span
                    className={`text-sm ${
                      testResult.success ? "text-green-300" : "text-red-300"
                    }`}
                  >
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            {/* Base URL */}
            <div className="space-y-2">
              <Label htmlFor="vapi-base-url" className="text-white">
                Base URL
              </Label>
              <Input
                id="vapi-base-url"
                value={config.vapi_base_url || "https://api.vapi.ai"}
                onChange={(e) => updateConfig("vapi_base_url", e.target.value)}
                placeholder="https://api.vapi.ai"
              />
              <p className="text-xs text-gray-500">
                Leave default unless using self-hosted Vapi instance
              </p>
            </div>

            {/* Organization ID */}
            <div className="space-y-2">
              <Label htmlFor="vapi-org-id" className="text-white">
                Vapi Organization ID (Optional)
              </Label>
              <Input
                id="vapi-org-id"
                value={config.vapi_org_id || ""}
                onChange={(e) => updateConfig("vapi_org_id", e.target.value)}
                placeholder="org_123..."
              />
              <p className="text-xs text-gray-500">
                Required only if your Vapi account uses multiple organizations
              </p>
            </div>

            {/* Default Assistants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-chat-assistant" className="text-white">
                  Default Chat Assistant
                </Label>
                <Select
                  onValueChange={(value) =>
                    updateConfig(
                      "default_chat_assistant_id",
                      value === "none" ? null : value,
                    )
                  }
                  value={config.default_chat_assistant_id || "none"}
                  disabled={!assistants.length}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue
                      placeholder={
                        assistants.length
                          ? "Select assistant"
                          : "Run test to load assistants"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name || assistant.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="custom-chat-assistant"
                  value={config.default_chat_assistant_id || ""}
                  onChange={(e) =>
                    updateConfig("default_chat_assistant_id", e.target.value)
                  }
                  placeholder="agnt_..."
                />
                <p className="text-xs text-gray-500">
                  Assistant ID for chat widget
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-call-assistant" className="text-white">
                  Default Call Assistant
                </Label>
                <Select
                  onValueChange={(value) =>
                    updateConfig(
                      "default_call_assistant_id",
                      value === "none" ? null : value,
                    )
                  }
                  value={config.default_call_assistant_id || "none"}
                  disabled={!assistants.length}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue
                      placeholder={
                        assistants.length
                          ? "Select assistant"
                          : "Run test to load assistants"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name || assistant.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="custom-call-assistant"
                  value={config.default_call_assistant_id || ""}
                  onChange={(e) =>
                    updateConfig("default_call_assistant_id", e.target.value)
                  }
                  placeholder="agnt_..."
                />
                <p className="text-xs text-gray-500">
                  Assistant ID for outbound calls
                </p>
              </div>
            </div>

            {assistants.length > 0 && (
              <div className="space-y-3">
                <Label className="text-white">Available Assistants</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {assistants.map((assistant) => (
                    <div
                      key={assistant.id}
                      className="rounded-lg border border-white/10 p-4 bg-white/5 space-y-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {assistant.name || assistant.id}
                        </p>
                        <p className="text-xs text-gray-400 break-all">
                          {assistant.id}
                        </p>
                      </div>
                      {assistant.description && (
                        <p className="text-xs text-gray-400 line-clamp-3">
                          {assistant.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleAssistantAssign(
                              "default_chat_assistant_id",
                              assistant.id,
                            )
                          }
                        >
                          Use for Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleAssistantAssign(
                              "default_call_assistant_id",
                              assistant.id,
                            )
                          }
                        >
                          Use for Calls
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
          <div className="flex gap-3">
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-2">White-label AI Integration</p>
              <ul className="space-y-1 text-blue-300/80 text-xs">
                <li>• Customers will see "AI Assistants" - never "Vapi"</li>
                <li>
                  • API keys are stored securely and never exposed to customers
                </li>
                <li>
                  • Each organization can have different AI configurations
                </li>
                <li>• Test connection before enabling for customers</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
