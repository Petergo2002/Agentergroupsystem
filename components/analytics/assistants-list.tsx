"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVapiAssistants } from "@/lib/analytics/useVapi";

export function AssistantsList() {
  const { assistants, isLoading, error, refresh } = useVapiAssistants();

  return (
    <Card>
      <CardHeader>
        <CardTitle>VAPI Assistenter</CardTitle>
        <CardDescription>
          Lista över konfigurerade assistenter i ditt VAPI-konto
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">
            {error.message || "Kunde inte hämta assistenter"}
          </div>
        ) : assistants.length === 0 ? (
          <div className="text-sm text-gray-600">
            Inga assistenter hittades. Kontrollera din API-nyckel eller skapa
            assistenter i VAPI.
          </div>
        ) : (
          <ul className="divide-y">
            {assistants.map((a) => (
              <li key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{a.name}</div>
                  {a.description && (
                    <div className="text-sm text-gray-600">{a.description}</div>
                  )}
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {a.status || "active"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
