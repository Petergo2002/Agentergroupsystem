"use client";

import { Calendar, Mail, Shield, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/lib/store";
import { createSupabaseClient } from "@/lib/supabase";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || "",
    email: user?.email || "",
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Profilinställningar
        </h1>
        <p className="text-gray-600 mt-1">
          Hantera din kontoinformation och dina preferenser
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profilinformation
          </CardTitle>
          <CardDescription>
            Uppdatera din personliga information och kontouppgifter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Fullständigt namn
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ange ditt fullständiga namn"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                E-postadress
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="E-post kan inte ändras"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
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

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Kontoinformation
          </CardTitle>
          <CardDescription>
            Visa din kontostatus och medlemskapsdetaljer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <h4 className="font-medium text-gray-900">Medlem sedan</h4>
                <p className="text-sm text-gray-600">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Okänt"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-green-500" />
              <div>
                <h4 className="font-medium text-gray-900">Kontostatus</h4>
                <p className="text-sm text-green-600 font-medium">Aktivt</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Riskområde</CardTitle>
          <CardDescription>
            Oåterkalleliga och destruktiva åtgärder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="font-medium text-red-800 mb-2">Ta bort konto</h4>
            <p className="text-sm text-red-600 mb-4">
              När du tar bort ditt konto finns ingen återvändo. Var helt säker.
              All din data inklusive kontakter, händelser och uppgifter kommer
              att raderas permanent.
            </p>
            <Button
              variant="destructive"
              onClick={() =>
                toast.error("Borttagning av konto är inte implementerad ännu")
              }
            >
              Ta bort konto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
