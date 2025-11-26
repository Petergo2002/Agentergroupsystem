"use client";

import {
  IconArrowRight,
  IconCalendar,
  IconChecklist,
  IconReceipt2,
  IconShieldCheck,
  IconSparkles,
  IconTool,
  IconUsers,
} from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAuthStore,
  useCustomersStore,
  useEventsStore,
  useInvoicesStore,
  useJobsStore,
  useLeadsStore,
  useQuotesStore,
  useTasksStore,
} from "@/lib/store";
import { formatDate, formatTime } from "@/lib/utils";

const SEK = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org");

  const customers = useCustomersStore((state) => state.customers);
  const leads = useLeadsStore((state) => state.leads);
  const jobs = useJobsStore((state) => state.jobs);
  const invoices = useInvoicesStore((state) => state.invoices);
  const quotes = useQuotesStore((state) => state.quotes);
  const events = useEventsStore((state) => state.events);
  const tasks = useTasksStore((state) => state.tasks);

  const metrics = useMemo(() => {
    const qualifiedLeads = leads.filter((lead) => lead.status === "qualified");
    const bookedJobs = jobs.filter(
      (job) => job.status === "scheduled" || job.status === "in_progress",
    );
    const completedJobs = jobs.filter((job) => job.status === "done");
    const paidInvoices = invoices.filter(
      (invoice) => invoice.status === "paid",
    );
    const overdueInvoices = invoices.filter((invoice) => {
      if (invoice.status === "overdue") return true;
      if (!invoice.due_date) return false;
      return (
        invoice.status !== "paid" && new Date(invoice.due_date) < new Date()
      );
    });

    const totalRevenue = paidInvoices.reduce(
      (sum, invoice) => sum + (invoice.amount || 0),
      0,
    );

    const upcomingJobs = jobs
      .filter((job) => job.start_time && new Date(job.start_time) > new Date())
      .sort(
        (a, b) =>
          new Date(a.start_time ?? 0).getTime() -
          new Date(b.start_time ?? 0).getTime(),
      )
      .slice(0, 4);

    const openTasks = tasks
      .filter((task) => task.status !== "done")
      .slice(0, 4);
    const upcomingEvents = events
      .filter((event) => new Date(event.start_time) > new Date())
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      )
      .slice(0, 4);

    return {
      qualifiedLeads,
      bookedJobs,
      completedJobs,
      totalRevenue,
      overdueInvoices,
      upcomingJobs,
      openTasks,
      upcomingEvents,
    };
  }, [leads, jobs, invoices, tasks, events]);

  return (
    <>
      <SiteHeader title="Entreprenadöversikt" showAddButton={false} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {orgId && (
          <Card className="border border-blue-500/40 bg-gradient-to-r from-blue-500/15 to-indigo-500/15">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
                  <IconShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-white">Admin-läge</p>
                  <p className="text-xs text-blue-100">
                    Visar data för organisation {orgId}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/organizations")}
              >
                Avsluta
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={IconSparkles}
            title="Inkomna leads"
            value={leads.length}
            description={`${metrics.qualifiedLeads.length} kvalificerade`}
            tone="blue"
          />
          <MetricCard
            icon={IconTool}
            title="Aktiva jobb"
            value={metrics.bookedJobs.length}
            description={`${metrics.completedJobs.length} slutförda denna månad`}
            tone="amber"
          />
          <MetricCard
            icon={IconUsers}
            title="Kunder"
            value={customers.length}
            description={`${quotes.length} offerter ute`}
            tone="green"
          />
          <MetricCard
            icon={IconReceipt2}
            title="Intäkter"
            value={SEK.format(metrics.totalRevenue)}
            description={`${metrics.overdueInvoices.length} fakturor förfaller`}
            tone="violet"
          />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Kommande jobb</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/jobs")}
              >
                Alla jobb
                <IconArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.upcomingJobs.length === 0 ? (
                <EmptyState
                  icon={IconTool}
                  title="Inga jobb inplanerade"
                  description="Planera nästa installation eller servicebesök för att hålla teamet sysselsatt."
                  actionLabel="Schemalägg jobb"
                  onAction={() => router.push("/jobs")}
                />
              ) : (
                metrics.upcomingJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition hover:border-primary/40"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {job.notes?.split("\n")[0] ?? "Installation"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.start_time
                          ? `${formatDate(job.start_time)} • ${formatTime(job.start_time)}`
                          : "Starttid saknas"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      Visa
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Kalender</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.upcomingEvents.length === 0 ? (
                  <EmptyState
                    icon={IconCalendar}
                    title="Ingen bokning idag"
                    description="Lägg till servicebesök eller platsmöten."
                    actionLabel="Öppna kalender"
                    onAction={() => router.push("/calendar")}
                    dense
                  />
                ) : (
                  metrics.upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-border bg-background p-3"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.start_time)} •{" "}
                        {formatTime(event.start_time)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Öppna uppgifter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.openTasks.length === 0 ? (
                  <EmptyState
                    icon={IconChecklist}
                    title="Allt under kontroll"
                    description="Ta emot fler jobb eller följ upp gamla leads."
                    actionLabel="Skapa uppgift"
                    onAction={() => router.push("/tasks")}
                    dense
                  />
                ) : (
                  metrics.openTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-border bg-background p-3"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Deadline {formatDate(task.due_date)}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}

type MetricCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "green" | "amber" | "violet";
};

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: MetricCardProps) {
  const toneClasses: Record<MetricCardProps["tone"], string> = {
    blue: "border-blue-500/30 bg-blue-500/10",
    green: "border-emerald-500/30 bg-emerald-500/10",
    amber: "border-amber-500/30 bg-amber-500/10",
    violet: "border-violet-500/30 bg-violet-500/10",
  };

  return (
    <Card className={`border ${toneClasses[tone]} transition hover:shadow-md`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  actionLabel: string;
  onAction: () => void;
  dense?: boolean;
};

function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  dense,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-center ${
        dense ? "p-4" : "p-6"
      }`}
    >
      <Icon className="mb-2 h-6 w-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      <Button onClick={onAction} size="sm" variant="outline" className="mt-3">
        {actionLabel}
      </Button>
    </div>
  );
}
