"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CallMetrics } from "@/lib/analytics/vapiParser";

const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<CallMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch call logs from our API route
        // For now, we'll use a placeholder API key or get it from environment
        const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY || "demo-key";
        const response = await fetch(
          `/api/vapi?apiKey=${encodeURIComponent(apiKey)}`,
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `HTTP ${response.status}: Failed to fetch analytics data`,
          );
        }
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <SiteHeader title="AI Voice Agent Analytics" showAddButton={false} />
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              AI Voice Agent Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Översikt över dina AI-agentens prestanda och kostnader
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {["total-calls", "avg-duration", "success-rate", "total-cost"].map(
              (key) => (
                <Skeleton key={key} className="h-32 w-full rounded-lg" />
              ),
            )}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SiteHeader title="AI Voice Agent Analytics" showAddButton={false} />
        <div className="p-6">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Fel vid inläsning av analys
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader title="AI Voice Agent Analytics" showAddButton={false} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Analysöversikt</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Totalt antal samtal
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <title>Totalt antal samtal</title>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.totalCalls || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.callChangePercent !== undefined
                  ? `${metrics.callChangePercent >= 0 ? "+" : ""}${metrics.callChangePercent}% from last month`
                  : "Ingen förändringsdata"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Genomsnittlig samtalslängd
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <title>Genomsnittlig samtalslängd</title>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.averageDuration
                  ? `${metrics.averageDuration}m`
                  : "0m"}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.durationChangePercent !== undefined
                  ? `${metrics.durationChangePercent >= 0 ? "+" : ""}${metrics.durationChangePercent}% from last month`
                  : "No change data"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Svarsfrekvens
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <title>Svarsfrekvens</title>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.successRate !== undefined
                  ? `${metrics.successRate}%`
                  : "Saknas"}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.successRateChangePercent !== undefined
                  ? `${metrics.successRateChangePercent >= 0 ? "+" : ""}${metrics.successRateChangePercent}% from last month`
                  : "No change data"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total kostnad
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <title>Total kostnad</title>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics?.totalCost?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.costChangePercent !== undefined
                  ? `${metrics.costChangePercent >= 0 ? "+" : ""}${metrics.costChangePercent}% from last month`
                  : "No change data"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Samtalsvolym</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {metrics?.callVolume ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Diagram för samtalsvolym visas här
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Ingen data för samtalsvolym tillgänglig
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Samtalsstatus</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {metrics?.callStatus ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Diagram för samtalsstatus visas här
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Ingen data för samtalsstatus tillgänglig
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AnalyticsDashboard;
