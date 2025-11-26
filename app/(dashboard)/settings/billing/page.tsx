"use client";

import { IconCheck, IconCreditCard, IconDownload } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BillingPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing</h1>
        <p className="text-gray-300 mt-1">
          Hantera din prenumeration och betalningsinformation
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Nuvarande Plan</CardTitle>
              <CardDescription className="text-gray-300">
                Din aktiva prenumeration
              </CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Aktiv
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">Professional Plan</h3>
              <p className="text-sm text-gray-600">
                Obegränsade kontakter, VAPI integration, AI-analys
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">499 kr</div>
              <div className="text-sm text-gray-600">per månad</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">
                Inkluderade funktioner:
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <IconCheck className="w-4 h-4 text-green-600" />
                  Obegränsade kontakter & leads
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <IconCheck className="w-4 h-4 text-green-600" />
                  VAPI röstassistent integration
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <IconCheck className="w-4 h-4 text-green-600" />
                  AI-driven samtalsanalys
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <IconCheck className="w-4 h-4 text-green-600" />
                  Kalender & automatisk bokning
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">
                Prenumerationsdetaljer:
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nästa faktura:</span>
                  <span className="font-medium">14 februari 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Betalningsmetod:</span>
                  <span className="font-medium">•••• 4242</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Aktiv</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline">Ändra plan</Button>
            <Button variant="outline">Uppdatera betalningsmetod</Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Betalningsmetod</CardTitle>
          <CardDescription className="text-gray-300">
            Hantera dina betalningsmetoder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                <IconCreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-medium">Visa •••• 4242</div>
                <div className="text-sm text-gray-600">Utgår 12/2025</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Redigera
              </Button>
              <Button variant="outline" size="sm">
                Ta bort
              </Button>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            + Lägg till betalningsmetod
          </Button>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Fakturahistorik</CardTitle>
          <CardDescription className="text-gray-300">
            Tidigare fakturor och betalningar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              {
                date: "14 jan 2025",
                amount: "499 kr",
                status: "Betald",
                invoice: "INV-2025-001",
              },
              {
                date: "14 dec 2024",
                amount: "499 kr",
                status: "Betald",
                invoice: "INV-2024-012",
              },
              {
                date: "14 nov 2024",
                amount: "499 kr",
                status: "Betald",
                invoice: "INV-2024-011",
              },
            ].map((item) => (
              <div
                key={item.invoice}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{item.invoice}</div>
                    <div className="text-sm text-gray-600">{item.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{item.amount}</div>
                    <div className="text-sm text-green-600">{item.status}</div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <IconDownload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Subscription */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Avsluta prenumeration</CardTitle>
          <CardDescription>
            Avsluta din prenumeration och förlora åtkomst till alla funktioner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600 mb-4">
              Om du avslutar din prenumeration kommer du att förlora åtkomst
              till:
            </p>
            <ul className="space-y-1 text-sm text-red-600 mb-4">
              <li>• VAPI integration och automatisk lead-generering</li>
              <li>• AI-driven samtalsanalys</li>
              <li>• Alla dina kontakter och data</li>
              <li>• Kalender och bokningsfunktioner</li>
            </ul>
            <Button variant="destructive">Avsluta prenumeration</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
