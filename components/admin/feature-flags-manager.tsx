"use client";

import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  type FeatureFlags as BaseFeatureFlags,
  DEFAULT_FEATURE_FLAGS,
} from "@/lib/feature-flags/types";

type FeatureFlags = BaseFeatureFlags & {
  id?: string;
  organization_id?: string;
};

interface FeatureFlagsManagerProps {
  organizationId: string;
  featureFlags?: FeatureFlags;
}

const featureGroups = [
  {
    title: "Sektioner",
    description:
      "Styr vilka delar av dashboarden organisationen har tillgång till",
    features: [
      {
        key: "calendar_enabled",
        label: "Kalender",
        description: "Planering och schema",
      },
      {
        key: "customers_enabled",
        label: "Kunder",
        description: "Kunddatabas och CRM",
      },
      { key: "leads_enabled", label: "Leads", description: "Leadshantering" },
      {
        key: "jobs_enabled",
        label: "Jobb",
        description: "Uppdrag och fältarbete",
      },
      {
        key: "quotes_enabled",
        label: "Offerter",
        description: "Offert- och anbudshantering",
      },
      {
        key: "invoices_enabled",
        label: "Fakturor",
        description: "Fakturering och betalningar",
      },
      {
        key: "tasks_enabled",
        label: "Uppgifter",
        description: "Att göra och uppföljning",
      },
      {
        key: "campaigns_enabled",
        label: "Kampanjer",
        description: "Marknadsföring och kampanjhantering",
      },
      {
        key: "ai_assistant_enabled",
        label: "AI-assistenter",
        description: "AI-drivna assistenter och automation",
      },
    ],
  },
  {
    title: "Analytics & Rapporter",
    description: "Styr tillgång till analytics och rapportfunktioner separat",
    features: [
      {
        key: "reports_enabled",
        label: "Rapporter",
        description: "Rapportgenerering och dokumentation",
      },
      {
        key: "chat_analytics_enabled",
        label: "AI Analytics – Chat",
        description: "Chattanalys och konversationshistorik",
      },
      {
        key: "call_analytics_enabled",
        label: "AI Analytics – Call",
        description: "Samtalsanalys och inspelningar",
      },
    ],
  },
  {
    title: "Integrationer",
    description: "Kanal- och utvecklarfunktioner",
    features: [
      {
        key: "voice_calls_enabled",
        label: "Voice Calls",
        description: "Integrated calling",
      },
      {
        key: "email_integration_enabled",
        label: "Email Integration",
        description: "Email sync and automation",
      },
      {
        key: "sms_integration_enabled",
        label: "SMS Integration",
        description: "SMS messaging",
      },
    ],
  },
  {
    title: "Branding",
    description: "Anpassning av varumärke",
    features: [
      {
        key: "api_access_enabled",
        label: "API Access",
        description: "REST API for integrations",
      },
      {
        key: "webhooks_enabled",
        label: "Webhooks",
        description: "Real-time event notifications",
      },
      {
        key: "custom_branding_enabled",
        label: "Custom Branding",
        description: "Logo and color customization",
      },
      {
        key: "white_label_enabled",
        label: "White Label",
        description: "Remove platform branding",
      },
    ],
  },
];

export function FeatureFlagsManager({
  organizationId,
  featureFlags,
}: FeatureFlagsManagerProps) {
  const router = useRouter();
  const [flags, setFlags] = useState<FeatureFlags>({
    ...DEFAULT_FEATURE_FLAGS,
    ...(featureFlags || {}),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!featureFlags) return;
    setFlags((prev) => ({
      ...prev,
      ...featureFlags,
    }));
  }, [featureFlags]);

  const handleToggle = (key: keyof FeatureFlags) => {
    setFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/features`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(flags),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update feature flags");
      }

      const updatedFlags = await response.json();
      setFlags((prev) => ({
        ...prev,
        ...(updatedFlags || {}),
      }));
      toast.success("Feature flags updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update feature flags");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {featureGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.features.map((feature) => (
              <div
                key={feature.key}
                className="flex items-center justify-between space-x-4 rounded-lg border p-4"
              >
                <div className="flex-1 space-y-1">
                  <Label htmlFor={feature.key} className="text-sm font-medium">
                    {feature.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                <Switch
                  id={feature.key}
                  checked={flags[feature.key as keyof FeatureFlags] as boolean}
                  onCheckedChange={() =>
                    handleToggle(feature.key as keyof FeatureFlags)
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
