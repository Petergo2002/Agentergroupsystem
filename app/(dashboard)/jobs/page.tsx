"use client";

import { useState } from "react";
import { JobCard } from "@/components/jobs/job-card";
import { JobDialog } from "@/components/jobs/job-dialog";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useJobsStore } from "@/lib/store";
import { getJobStatusLabel } from "@/lib/types/contractor";

export default function JobsPage() {
  const { jobs } = useJobsStore();
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "scheduled" | "in_progress" | "done"
  >("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "next7">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const hasActiveFilter =
    statusFilter !== "all" ||
    dateFilter !== "all" ||
    searchQuery.trim().length > 0;

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== "all" && job.status !== statusFilter) {
      return false;
    }

    if (dateFilter !== "all") {
      if (!job.start_time) return false;
      const start = new Date(job.start_time as string);
      if (Number.isNaN(start.getTime())) return false;

      const now = new Date();

      if (dateFilter === "today") {
        const isSameDay =
          start.getFullYear() === now.getFullYear() &&
          start.getMonth() === now.getMonth() &&
          start.getDate() === now.getDate();
        if (!isSameDay) return false;
      } else if (dateFilter === "next7") {
        const sevenDaysAhead = new Date(now);
        sevenDaysAhead.setDate(now.getDate() + 7);
        if (start < now || start > sevenDaysAhead) return false;
      }
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const note = (job.notes ?? "").toString().toLowerCase();
      const assigned = (job.assigned_to ?? "").toString().toLowerCase();
      if (!note.includes(query) && !assigned.includes(query)) {
        return false;
      }
    }

    return true;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const getTime = (value: string | null | undefined) => {
      if (!value) return Number.POSITIVE_INFINITY;
      const timestamp = new Date(value as string).getTime();
      return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
    };
    return (
      getTime(a.start_time as string | null | undefined) -
      getTime(b.start_time as string | null | undefined)
    );
  });

  const grouped = {
    scheduled: sortedJobs.filter((job) => job.status === "scheduled"),
    in_progress: sortedJobs.filter((job) => job.status === "in_progress"),
    done: sortedJobs.filter((job) => job.status === "done"),
  };

  return (
    <>
      <SiteHeader title="Jobb" showAddButton={false} />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Planerade uppdrag</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setJobDialogOpen(true)}
              >
                Planera nytt jobb
              </Button>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <Input
                placeholder="Sök i jobb (anteckningar, montör)"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="md:max-w-sm"
              />
              <div className="flex gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(
                      value as "all" | "scheduled" | "in_progress" | "done",
                    )
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla statusar</SelectItem>
                    <SelectItem value="scheduled">
                      {getJobStatusLabel("scheduled")}
                    </SelectItem>
                    <SelectItem value="in_progress">
                      {getJobStatusLabel("in_progress")}
                    </SelectItem>
                    <SelectItem value="done">
                      {getJobStatusLabel("done")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={dateFilter}
                  onValueChange={(value) =>
                    setDateFilter(value as "all" | "today" | "next7")
                  }
                >
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Datum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla datum</SelectItem>
                    <SelectItem value="today">Idag</SelectItem>
                    <SelectItem value="next7">Kommande 7 dagar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["scheduled", "in_progress", "done"] as const)
              .filter(
                (status) => statusFilter === "all" || statusFilter === status,
              )
              .map((status) => (
                <section key={status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {getJobStatusLabel(status)} ({grouped[status].length})
                    </h3>
                  </div>
                  {grouped[status].length === 0 ? (
                    <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      {hasActiveFilter
                        ? "Inga jobb matchar dina filter."
                        : "Inga jobb i detta steg."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {grouped[status].map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onClick={() => {
                            setEditingJobId(job.id);
                            setJobDialogOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}
          </CardContent>
        </Card>
      </div>
      <JobDialog
        open={jobDialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditingJobId(null);
          setJobDialogOpen(open);
        }}
        jobId={editingJobId ?? undefined}
      />
    </>
  );
}
