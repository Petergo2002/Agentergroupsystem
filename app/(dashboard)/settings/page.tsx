"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store";
import {
  BRANDING_EVENT,
  writeBrandingCache,
} from "@/lib/branding-cache";
import { createSupabaseClient } from "@/lib/supabase";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || "",
    email: user?.email || "",
  });
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [branding, setBranding] = useState({
    companyName: "",
    logoUrl: "",
  });

  const handleUpdateProfile = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setLoading(true);

    try {
      const supabase = createSupabaseClient();

      // Update auth user metadata
      const { data: authData, error: authError } =
        await supabase.auth.updateUser({
          data: { name: formData.name },
        });

      if (authError) throw authError;

      // Update user profile in database
      const { error: dbError } = await supabase
        .from("users")
        .update({ name: formData.name })
        .eq("id", user?.id);

      if (dbError) throw dbError;

      setUser(authData.user as any);
      toast.success("Profilen har uppdaterats");
    } catch (error: any) {
      toast.error(error.message || "Det gick inte att uppdatera profilen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadBranding = async () => {
      setBrandingLoading(true);
      try {
        const response = await fetch("/api/organization/branding");
        if (!response.ok) return;
        const json = await response.json();
        const data = json?.data || {};
        setBranding({
          companyName:
            typeof data.name === "string" && data.name.trim()
              ? data.name
              : "",
          logoUrl:
            typeof data.logo_url === "string" && data.logo_url.trim()
              ? data.logo_url
              : "",
        });
      } catch (error) {
        console.error(error);
      } finally {
        setBrandingLoading(false);
      }
    };

    loadBranding();
  }, []);

  const handleSaveBranding = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setBrandingSaving(true);

    try {
      const payload: { name?: string; logo_url?: string | null } = {};

      if (branding.companyName.trim()) {
        payload.name = branding.companyName.trim();
      }

      payload.logo_url = branding.logoUrl.trim() || null;

      const response = await fetch("/api/organization/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.error || "Det gick inte att spara företagsprofilen",
        );
      }

      const normalized = {
        name: payload.name ?? null,
        logoUrl: payload.logo_url ?? null,
      };
      writeBrandingCache(normalized);
      window.dispatchEvent(
        new CustomEvent(BRANDING_EVENT, {
          detail: normalized,
        }),
      );
      toast.success("Företagsprofilen har uppdaterats");
    } catch (error: any) {
      toast.error(
        error?.message || "Det gick inte att spara företagsprofilen",
      );
    } finally {
      setBrandingSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">
          Allmänna inställningar
        </h1>
        <p className="text-muted-foreground">
          Hantera din profil och applikationsinställningar
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Företagsprofil</CardTitle>
          <CardDescription>
            Ställ in företagsnamn och logotyp som visas i sidomenyn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveBranding} className="space-y-4">
            <div>
              <Label htmlFor="companyName">Företagsnamn</Label>
              <Input
                id="companyName"
                type="text"
                value={branding.companyName}
                onChange={(event) =>
                  setBranding((prev) => ({
                    ...prev,
                    companyName: event.target.value,
                  }))
                }
                placeholder="Ange ditt företagsnamn"
                disabled={brandingLoading || brandingSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>Logotyp</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Ladda upp din företagslogotyp som visas i sidomenyn
              </p>
              <ImageUpload
                value={branding.logoUrl}
                onChange={(url: string) =>
                  setBranding((prev) => ({
                    ...prev,
                    logoUrl: url,
                  }))
                }
                onRemove={() =>
                  setBranding((prev) => ({
                    ...prev,
                    logoUrl: "",
                  }))
                }
                maxSizeMB={2}
                aspectRatio="1/1"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={brandingLoading || brandingSaving}>
                {brandingSaving ? "Sparar..." : "Spara företagsprofil"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Profilinställningar */}
      <Card>
        <CardHeader>
          <CardTitle>Profilinformation</CardTitle>
          <CardDescription>
            Uppdatera din personliga information och kontodetaljer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="name">Fullständigt namn</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Ange ditt fullständiga namn"
              />
            </div>

            <div>
              <Label htmlFor="email">E-postadress</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                readOnly
                disabled
                placeholder="E-post kan inte ändras"
              />
              <p className="text-xs text-muted-foreground">
                E-postadressen kan inte ändras. Kontakta supporten om du behöver
                uppdatera den.
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Uppdaterar..." : "Uppdatera profil"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Applikationsinformation */}
      <Card>
        <CardHeader>
          <CardTitle>Om Calendar CRM</CardTitle>
          <CardDescription>
            Applikationsinformation och versionsdetaljer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground">Version</h4>
              <p className="text-sm text-muted-foreground">1.0.0</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Byggd med</h4>
              <p className="text-sm text-muted-foreground">
                Next.js 14, TypeScript, Supabase
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Funktioner</h4>
              <p className="text-sm text-muted-foreground">
                Kalender, Kontakter, Uppgifter, Realtidssynk
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Support</h4>
              <p className="text-sm text-muted-foreground">
                Kontakta din administratör
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Snabblänkar till andra inställningar */}
      <Card>
        <CardHeader>
          <CardTitle>Övriga inställningar</CardTitle>
          <CardDescription>
            Snabblänkar till andra inställningssektioner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link
              href="/settings/billing"
              className="group block rounded-lg border border-border bg-card/40 p-4 transition-colors hover:bg-accent"
            >
              <h3 className="mb-1 font-medium text-foreground group-hover:text-accent-foreground">
                Billing
              </h3>
              <p className="text-sm text-muted-foreground group-hover:text-accent-foreground">
                Prenumeration och betalningsinformation
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>

      
    </div>
  );
}
