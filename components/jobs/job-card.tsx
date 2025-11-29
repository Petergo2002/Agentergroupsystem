"use client";

import { IconClockHour4, IconTool, IconUser } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  estimateJobDurationHours,
  getJobStatusLabel,
} from "@/lib/types/contractor";
import { formatDate, formatTime } from "@/lib/utils";

const SEK = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 0,
});

type JobStatus = "scheduled" | "in_progress" | "done";

interface JobCardProps {
  job: {
    id: string;
    status: JobStatus;
    start_time?: string | null;
    end_time?: string | null;
    notes?: string | null;
    price_estimate?: number | null;
    assigned_to?: string | null;
    materials?: any;
  };
  onClick: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const durationHours = estimateJobDurationHours(job.start_time, job.end_time);

  const statusClasses: Record<JobStatus, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    done: "bg-emerald-100 text-emerald-700",
  };

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer border border-border/70 transition hover:border-primary/40 hover:shadow-lg"
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {job.notes?.split("\n")[0] ?? "Planerat jobb"}
            </p>
            {job.price_estimate ? (
              <p className="text-xs text-muted-foreground">
                Budget {SEK.format(job.price_estimate)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {getJobStatusLabel(job.status)}
              </p>
            )}
          </div>
          <Badge className={statusClasses[job.status]}>
            {getJobStatusLabel(job.status)}
          </Badge>
        </div>

        <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
          {job.start_time ? (
            <div className="flex items-center gap-2">
              <IconClockHour4 className="h-4 w-4" />
              <span>
                {formatDate(new Date(job.start_time))}{" "}
                {formatTime(new Date(job.start_time))}
                {job.end_time ? ` – ${formatTime(new Date(job.end_time))}` : ""}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <IconClockHour4 className="h-4 w-4" />
              <span>Ingen starttid planerad</span>
            </div>
          )}
          {durationHours && (
            <p className="mt-1 text-xs text-muted-foreground">
              Beräknad tid {durationHours} h
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {job.assigned_to && (
            <span className="flex items-center gap-1">
              <IconUser className="h-3.5 w-3.5" />
              Montör: {job.assigned_to.slice(0, 6)}
            </span>
          )}
          {Array.isArray((job.materials as any)?.items) &&
            (job.materials as any).items.length > 0 && (
              <span className="flex items-center gap-1">
                <IconTool className="h-3.5 w-3.5" />
                {(job.materials as any).items.length} artiklar
              </span>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
