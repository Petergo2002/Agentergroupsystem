"use client";

import {
  IconClock,
  IconDotsVertical,
  IconSearch,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

// Lazy load heavy chart components
const LazyAreaChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.AreaChart })),
  { ssr: false },
);
const LazyLineChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.LineChart })),
  { ssr: false },
);
const LazyResponsiveContainer = dynamic(
  () =>
    import("recharts").then((mod) => ({ default: mod.ResponsiveContainer })),
  { ssr: false },
);

// Import only what we need from recharts (tree-shaken)
import { Area, CartesianGrid, Line, Tooltip, XAxis, YAxis } from "recharts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useAuthStore,
  useCustomersStore,
  useEventsStore,
  useInvoicesStore,
  useJobsStore,
  useLeadsStore,
  useTasksStore,
} from "@/lib/store";
import { cn, formatDate, formatTime } from "@/lib/utils";

const SEK = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 0,
});

// Static data - memoized outside component to prevent re-creation
const SPARKLINE_DATA = [
  { value: 65 },
  { value: 78 },
  { value: 52 },
  { value: 91 },
  { value: 83 },
  { value: 67 },
  { value: 95 },
  { value: 72 },
  { value: 88 },
  { value: 76 },
];

const CHART_DATA = [
  { name: "Jan", value: 12000 },
  { name: "Feb", value: 19000 },
  { name: "Mar", value: 15000 },
  { name: "Apr", value: 27000 },
  { name: "May", value: 25000 },
  { name: "Jun", value: 32000 },
  { name: "Jul", value: 28000 },
  { name: "Aug", value: 34000 },
  { name: "Sep", value: 38000 },
  { name: "Oct", value: 42000 },
  { name: "Nov", value: 45000 },
  { name: "Dec", value: 48000 },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const _orgId = searchParams.get("org");

  const customers = useCustomersStore((state) => state.customers);
  const leads = useLeadsStore((state) => state.leads);
  const jobs = useJobsStore((state) => state.jobs);
  const invoices = useInvoicesStore((state) => state.invoices);
  const events = useEventsStore((state) => state.events);
  const tasks = useTasksStore((state) => state.tasks);

  const [date, setDate] = useState<Date | undefined>(new Date());

  const userName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Användare";

  const metrics = useMemo(() => {
    const qualifiedLeads = leads.filter((lead) => lead.status === "qualified");
    const bookedJobs = jobs.filter(
      (job) => job.status === "scheduled" || job.status === "in_progress",
    );
    const completedJobs = jobs.filter((job) => job.status === "done");
    const paidInvoices = invoices.filter(
      (invoice) => invoice.status === "paid",
    );

    const totalRevenue = paidInvoices.reduce(
      (sum, invoice) => sum + (invoice.amount || 0),
      0,
    );

    const upcomingEvents = events
      .filter((event) => new Date(event.start_time) > new Date())
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      )
      .slice(0, 4);

    const openTasks = tasks
      .filter((task) => task.status !== "done")
      .slice(0, 4);

    return {
      qualifiedLeads,
      bookedJobs,
      completedJobs,
      totalRevenue,
      upcomingEvents,
      openTasks,
    };
  }, [leads, jobs, invoices, events, tasks]);

  return (
    <div className="flex flex-col gap-6 p-6 bg-muted/30 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            God morgon, {userName}
          </h1>
          <p className="text-muted-foreground text-sm">
            Det är {formatDate(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök vad som helst..."
              className="pl-8 bg-background"
            />
          </div>
          <Button onClick={() => router.push("/leads")}>
            + Lägg till Lead
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Totala Leads"
          value={leads.length}
          trend={+40}
          trendLabel="vs förra månaden"
          data={SPARKLINE_DATA}
          color="#10b981" // emerald
        />
        <MetricCard
          title="Aktiva Jobb"
          value={metrics.bookedJobs.length}
          trend={-10}
          trendLabel="vs förra månaden"
          data={SPARKLINE_DATA}
          color="#f59e0b" // amber
        />
        <MetricCard
          title="Kunder"
          value={customers.length}
          trend={+20}
          trendLabel="vs förra månaden"
          data={SPARKLINE_DATA}
          color="#f97316" // orange
        />
        <MetricCard
          title="Intäkter"
          value={metrics.totalRevenue}
          currency
          trend={+20}
          trendLabel="vs förra månaden"
          data={SPARKLINE_DATA}
          color="#0ea5e9" // sky
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (2/3 width on XL) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Key Metrics Chart */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">
                  Nyckeltal
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Översikt över verksamheten
                </p>
              </div>
              <Select defaultValue="30d">
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 dagar</SelectItem>
                  <SelectItem value="30d">30 dagar</SelectItem>
                  <SelectItem value="90d">90 dagar</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <LazyResponsiveContainer width="100%" height="100%">
                  <LazyAreaChart data={CHART_DATA}>
                    <defs>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#888" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#888" }}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      strokeWidth={2}
                    />
                  </LazyAreaChart>
                </LazyResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance / Employees Table */}
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Senaste Kunder
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  Filter
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {customers.slice(0, 5).map((customer, _i) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {customer.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Aktiv
                        </span>
                      </div>
                    </div>
                  ))}
                  {customers.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Inga kunder hittades
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily Time Limits / Latest Jobs */}
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Kommande Jobb
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => router.push("/jobs")}
                >
                  Visa alla
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {metrics.bookedJobs.slice(0, 5).map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <IconClock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {job.notes?.split("\n")[0] || "Jobb utan titel"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {job.start_time
                              ? formatTime(job.start_time)
                              : "Ingen tid"}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {/* Placeholder for duration or amount */}
                        2h
                      </div>
                    </div>
                  ))}
                  {metrics.bookedJobs.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Inga bokade jobb
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column (1/3 width on XL) */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Kalender & Uppgifter
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                Se alla
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-6">
              <div className="flex justify-center border-b pb-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Kommande händelser</h3>
                </div>
                <div className="space-y-3">
                  {metrics.upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="w-1 h-full bg-blue-500 rounded-full min-h-[30px]" />
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.start_time)} •{" "}
                          {formatTime(event.start_time)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {metrics.upcomingEvents.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Inga händelser
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Uppgifter</h3>
                </div>
                <div className="space-y-2">
                  {metrics.openTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {task.title}
                        </span>
                      </div>
                    </div>
                  ))}
                  {metrics.openTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Inga öppna uppgifter
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  data,
  color,
  currency,
}: {
  title: string;
  value: number | string;
  trend: number;
  trendLabel: string;
  data: Array<{ value: number }>;
  color: string;
  currency?: boolean;
}) {
  return (
    <Card className="border-none shadow-sm overflow-hidden relative">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <IconDotsVertical className="h-4 w-4 text-muted-foreground cursor-pointer" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold">
            {currency && typeof value === "number" ? SEK.format(value) : value}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "flex items-center font-medium",
                trend > 0 ? "text-green-600" : "text-red-600",
              )}
            >
              {trend > 0 ? (
                <IconTrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <IconTrendingDown className="mr-1 h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </span>
            <span className="text-muted-foreground">{trendLabel}</span>
          </div>
        </div>
        <div className="h-[50px] mt-4 -mx-2">
          <LazyResponsiveContainer width="100%" height="100%">
            <LazyLineChart data={data}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
              />
            </LazyLineChart>
          </LazyResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
