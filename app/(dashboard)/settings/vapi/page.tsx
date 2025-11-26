"use client";

import { ApiKeyManager } from "@/components/settings/api-key-manager";

export default function VapiIntegrationPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">API-integration</h1>
        <p className="text-muted-foreground">
          Anslut din röstassistent för att automatiskt hantera fastigheter,
          leads och bokningar.
        </p>
      </div>

      <ApiKeyManager />
    </div>
  );
}
