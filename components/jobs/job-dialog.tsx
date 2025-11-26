"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore, useJobsStore, useLeadsStore } from "@/lib/store";
import { createSupabaseClient, IS_DEMO_MODE } from "@/lib/supabase";
import {
  estimateJobDurationHours,
  getJobStatusLabel,
  getLeadStatusLabel,
} from "@/lib/types/contractor";

type JobFormState = {
  lead_id: string | null;
  assigned_to: string | null;
  start_time: string;
  end_time: string;
  status: "scheduled" | "in_progress" | "done";
  notes: string;
  cost_estimate: string;
  price_estimate: string;
};

const DEFAULT_STATE: JobFormState = {
  lead_id: null,
  assigned_to: null,
  start_time: "",
  end_time: "",
  status: "scheduled",
  notes: "",
  cost_estimate: "",
  price_estimate: "",
};

interface JobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId?: string | null;
}

export function JobDialog({ open, onOpenChange, jobId }: JobDialogProps) {
  const user = useAuthStore((state) => state.user);
  const { jobs, addJob, updateJob, setLoading } = useJobsStore();
  const leads = useLeadsStore((state) => state.leads);
  const editing = Boolean(jobId);
  const existingJob = jobs.find((job) => job.id === jobId);
  const [formState, setFormState] = useState<JobFormState>(DEFAULT_STATE);

  const durationHours = estimateJobDurationHours(
    formState.start_time || null,
    formState.end_time || null,
  );

  useEffect(() => {
    if (!open) {
      setFormState(DEFAULT_STATE);
      return;
    }

    if (editing && existingJob) {
      setFormState({
        lead_id: existingJob.lead_id,
        assigned_to: existingJob.assigned_to,
        start_time: existingJob.start_time
          ? existingJob.start_time.slice(0, 16)
          : "",
        end_time: existingJob.end_time ? existingJob.end_time.slice(0, 16) : "",
        status: existingJob.status,
        notes: existingJob.notes ?? "",
        cost_estimate: existingJob.cost_estimate
          ? existingJob.cost_estimate.toString()
          : "",
        price_estimate: existingJob.price_estimate
          ? existingJob.price_estimate.toString()
          : "",
      });
    } else {
      setFormState(DEFAULT_STATE);
    }
  }, [editing, existingJob, open]);

  const handleChange = (field: keyof JobFormState, value: string | null) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (!user && !IS_DEMO_MODE) {
        toast.error("Du måste vara inloggad för att spara jobb");
        return;
      }

      if (formState.start_time && formState.end_time) {
        const start = new Date(formState.start_time);
        const end = new Date(formState.end_time);
        if (
          Number.isNaN(start.getTime()) ||
          Number.isNaN(end.getTime()) ||
          end <= start
        ) {
          toast.error("Sluttid måste vara efter starttid");
          return;
        }
      }

      if (!formState.lead_id && !formState.notes.trim()) {
        toast.error("Lägg till ett lead eller anteckningar för jobbet");
        return;
      }

      setLoading(true);
      const supabase = createSupabaseClient();
      const basePayload = {
        lead_id: formState.lead_id,
        assigned_to: formState.assigned_to,
        start_time: formState.start_time
          ? new Date(formState.start_time).toISOString()
          : null,
        end_time: formState.end_time
          ? new Date(formState.end_time).toISOString()
          : null,
        status: formState.status,
        notes: formState.notes.trim() || null,
        cost_estimate: formState.cost_estimate
          ? Number(formState.cost_estimate)
          : null,
        price_estimate: formState.price_estimate
          ? Number(formState.price_estimate)
          : null,
      };
      const payload = user?.id
        ? { ...basePayload, user_id: user.id }
        : basePayload;

      if (editing && jobId) {
        const { data, error } = await supabase
          .from("jobs")
          .update(payload)
          .eq("id", jobId)
          .select()
          .single();
        if (error) throw error;
        updateJob(jobId, data);
        toast.success("Jobb uppdaterat");
      } else {
        const { data, error } = await supabase
          .from("jobs")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        addJob(data);
        toast.success("Jobb skapat");
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte spara jobbet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Redigera jobb" : "Planera jobb"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Koppla lead</Label>
            <Select
              value={formState.lead_id ?? "none"}
              onValueChange={(value) =>
                handleChange("lead_id", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Inget lead</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.job_type ?? "Lead"} –{" "}
                    {getLeadStatusLabel(lead.status as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_time">Starttid</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formState.start_time}
                onChange={(event) =>
                  handleChange("start_time", event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Sluttid</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formState.end_time}
                onChange={(event) =>
                  handleChange("end_time", event.target.value)
                }
              />
            </div>
          </div>

          {durationHours && (
            <p className="text-xs text-muted-foreground">
              Beräknad tid {durationHours} h
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formState.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Tilldelad användare</Label>
              <Input
                id="assigned_to"
                value={formState.assigned_to ?? ""}
                onChange={(event) =>
                  handleChange("assigned_to", event.target.value || null)
                }
                placeholder="Ange användar-ID eller mejl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cost_estimate">Egen kostnad (SEK)</Label>
              <Input
                id="cost_estimate"
                type="number"
                min={0}
                value={formState.cost_estimate}
                onChange={(event) =>
                  handleChange("cost_estimate", event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_estimate">Offererat pris (SEK)</Label>
              <Input
                id="price_estimate"
                type="number"
                min={0}
                value={formState.price_estimate}
                onChange={(event) =>
                  handleChange("price_estimate", event.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Anteckningar</Label>
            <Textarea
              id="notes"
              rows={4}
              value={formState.notes}
              onChange={(event) => handleChange("notes", event.target.value)}
              placeholder="Beskriv arbetsmoment, material eller särskilda förutsättningar."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button type="submit">
              {editing ? "Spara jobb" : "Planera jobb"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
