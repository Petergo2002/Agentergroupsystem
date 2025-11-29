"use client";

import { Check, Copy, Mail, User } from "lucide-react";
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

interface OrganizationCredentialsProps {
  owner: {
    name: string;
    email: string;
  } | null;
  organizationName: string;
}

export function OrganizationCredentials({
  owner,
  organizationName,
}: OrganizationCredentialsProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "email") {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
      toast.success(`${type} kopierad!`);
    } catch (_error) {
      toast.error("Kunde inte kopiera");
    }
  };

  if (!owner) {
    return (
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Användaruppgifter</CardTitle>
          <CardDescription className="text-gray-400">
            Ingen ägare tilldelad än
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-[#111111] border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Användaruppgifter</CardTitle>
        <CardDescription className="text-gray-400">
          Inloggningsuppgifter för {organizationName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Owner Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400 mb-1">Ägare</p>
                <p className="text-lg font-semibold text-white">{owner.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Mail className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400 mb-1">
                  E-postadress
                </p>
                <p className="text-lg font-semibold text-white break-all">
                  {owner.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(owner.email, "E-post")}
              className="ml-2 text-gray-400 hover:text-white"
            >
              {copiedEmail ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-300">
            <strong>Obs:</strong> Lösenordet visas inte av säkerhetsskäl. Om
            användaren behöver återställa sitt lösenord, kan du skapa ett nytt
            konto eller be dem kontakta supporten.
          </p>
        </div>

        {/* Login Instructions */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">
            Inloggningsinstruktioner
          </h4>
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 space-y-2">
            <p className="text-sm text-gray-300">
              1. Gå till inloggningssidan:{" "}
              <code className="px-2 py-1 bg-gray-800 rounded text-blue-400">
                /auth/login
              </code>
            </p>
            <p className="text-sm text-gray-300">
              2. Använd e-postadressen:{" "}
              <code className="px-2 py-1 bg-gray-800 rounded text-purple-400">
                {owner.email}
              </code>
            </p>
            <p className="text-sm text-gray-300">
              3. Ange lösenordet som skapades vid registrering
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
