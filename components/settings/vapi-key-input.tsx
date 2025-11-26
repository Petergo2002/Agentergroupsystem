"use client";

import { Eye, EyeOff, Save } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store";
import { createSupabaseClient } from "@/lib/supabase";

export function VapiKeyInput() {
  const [vapiKey, setVapiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
          .from("users")
          .select("vapi_api_key")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data?.vapi_api_key) {
          setHasKey(true);
          // Don't show the actual key, just indicate it exists
          setVapiKey("••••••••••••••••••••••••••••••••");
        }
      } catch (error: any) {
        console.error("Error loading V-API key:", error);
      }
    };

    void load();
  }, [user?.id]);

  const saveVapiKey = async () => {
    if (!vapiKey || vapiKey.startsWith("••••")) {
      toast.error("Vänligen ange en giltig V-API nyckel");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from("users")
        .update({ vapi_api_key: vapiKey })
        .eq("id", user?.id);

      if (error) throw error;

      setHasKey(true);
      toast.success("V-API nyckel sparad!");
      setShowKey(false);
      setVapiKey("••••••••••••••••••••••••••••••••");
    } catch (error: any) {
      console.error("Error saving V-API key:", error);
      toast.error("Kunde inte spara V-API nyckel");
    } finally {
      setLoading(false);
    }
  };

  const removeVapiKey = async () => {
    if (!confirm("Är du säker på att du vill ta bort V-API nyckeln?")) {
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from("users")
        .update({ vapi_api_key: null })
        .eq("id", user?.id);

      if (error) throw error;

      setHasKey(false);
      setVapiKey("");
      toast.success("V-API nyckel borttagen");
    } catch (error: any) {
      console.error("Error removing V-API key:", error);
      toast.error("Kunde inte ta bort V-API nyckel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">V-API Integration</CardTitle>
        <CardDescription className="text-gray-300">
          Anslut din V-API nyckel för att se samtalsanalys och inspelningar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vapi-key">V-API Nyckel</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="vapi-key"
                type={showKey ? "text" : "password"}
                value={vapiKey}
                onChange={(e) => setVapiKey(e.target.value)}
                placeholder="Ange din V-API nyckel"
                className="pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <Button onClick={saveVapiKey} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Spara
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Hitta din V-API nyckel i V-API Dashboard under Settings → API Keys
          </p>
        </div>

        {hasKey && (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-800 font-medium">
                V-API nyckel är ansluten
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={removeVapiKey}
              disabled={loading}
            >
              Ta bort
            </Button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Vad kan du göra med V-API?
          </h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Se alla dina samtal och inspelningar</li>
            <li>• Analysera samtalsdata och statistik</li>
            <li>• Spåra konverteringar från samtal till leads</li>
            <li>• Granska transkriptioner och sammanfattningar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
