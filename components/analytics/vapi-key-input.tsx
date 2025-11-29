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
import { useVapiKey } from "@/lib/analytics/useVapi";

export function VapiKeyInput() {
  const { apiKey, orgId, setApiKey, setOrgId, clearApiKey } = useVapiKey();
  const [keyValue, setKeyValue] = useState("");
  const [orgValue, setOrgValue] = useState("");

  useEffect(() => {
    setKeyValue(apiKey ?? "");
  }, [apiKey]);

  useEffect(() => {
    setOrgValue(orgId ?? "");
  }, [orgId]);

  const handleSave = () => {
    if (!keyValue.trim()) {
      toast.error("Ange en giltig VAPI API-nyckel");
      return;
    }
    setApiKey(keyValue.trim());
    setOrgId(orgValue.trim() || null);
    toast.success("VAPI-inställningar sparade lokalt");
  };

  const handleClear = () => {
    clearApiKey();
    setKeyValue("");
    setOrgValue("");
    toast.success("VAPI-inställningar rensade");
  };

  const masked = apiKey ? `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}` : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect VAPI</CardTitle>
        <CardDescription>
          Spara din VAPI API-nyckel{` `}
          {orgId
            ? "och organisations-ID"
            : " (och valfritt organisations-ID om ditt konto kräver det)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label
            htmlFor="vapi-api-key"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            API-nyckel
          </label>
          <div className="flex gap-2">
            <Input
              id="vapi-api-key"
              placeholder="vk_live_... eller servernyckel"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
            />
            <Button onClick={handleSave}>Spara</Button>
            <Button variant="secondary" onClick={handleClear}>
              Rensa
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Aktuell nyckel: {masked}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Använd en giltig VAPI server-API-nyckel med behörigheter för
            assistenter, samtalsloggar och utgående samtal.
          </div>
        </div>

        <div>
          <label
            htmlFor="vapi-org-id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Organisation ID (valfritt)
          </label>
          <Input
            id="vapi-org-id"
            placeholder="t.ex. org_123..."
            value={orgValue}
            onChange={(e) => setOrgValue(e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
            Vissa konton kräver att du skickar ett organisations-ID via headern
            X-Organization-Id.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
