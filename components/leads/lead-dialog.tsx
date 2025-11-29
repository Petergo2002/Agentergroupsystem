"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCustomersStore, useLeadsStore } from "@/lib/store";
import { createSupabaseClient } from "@/lib/supabase";
import { getLeadStatusLabel } from "@/lib/types/contractor";

type LeadFormState = {
  customer_id: string | null;
  job_type: string;
  description: string;
  address: string;
  budget: string;
  source: string;
  status: "new" | "qualified" | "quoted" | "booked" | "completed";
  is_qualified: boolean;
};

const DEFAULT_STATE: LeadFormState = {
  customer_id: null,
  job_type: "",
  description: "",
  address: "",
  budget: "",
  source: "web",
  status: "new",
  is_qualified: false,
};

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string | null;
}

export function LeadDialog({ open, onOpenChange, leadId }: LeadDialogProps) {
  const customers = useCustomersStore((state) => state.customers);
  const { leads, addLead, updateLead, setLoading } = useLeadsStore();
  const editing = Boolean(leadId);
  const existingLead = leads.find((lead) => lead.id === leadId);
  const [formState, setFormState] = useState<LeadFormState>(DEFAULT_STATE);

  const sortedCustomers = useMemo(
    () => customers.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [customers],
  );

  useEffect(() => {
    if (!open) {
      setFormState(DEFAULT_STATE);
      return;
    }

    if (editing && existingLead) {
      setFormState({
        customer_id: existingLead.customer_id,
        job_type: existingLead.job_type ?? "",
        description: existingLead.description ?? "",
        address: existingLead.address ?? "",
        budget: existingLead.budget ? existingLead.budget.toString() : "",
        source: existingLead.source ?? "web",
        status: existingLead.status ?? "new",
        is_qualified: existingLead.is_qualified ?? false,
      });
    } else {
      setFormState(DEFAULT_STATE);
    }
  }, [editing, existingLead, open]);

  const handleChange = (
    field: keyof LeadFormState,
    value: string | boolean | null,
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const supabase = createSupabaseClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.job_type.trim()) {
      toast.error("Ange ett jobbnamn");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        customer_id: formState.customer_id || null,
        job_type: formState.job_type.trim(),
        description: formState.description.trim() || null,
        address: formState.address.trim() || null,
        budget: formState.budget ? Number(formState.budget) : null,
        source: formState.source || null,
        status: formState.status,
        is_qualified: formState.is_qualified,
      };

      if (editing && leadId) {
        const { data, error } = await supabase
          .from("leads")
          .update(payload)
          .eq("id", leadId)
          .select()
          .single();
        if (error) throw error;
        updateLead(leadId, data);
        toast.success("Lead uppdaterad");
      } else {
        const { data, error } = await supabase
          .from("leads")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        addLead(data);
        toast.success("Lead skapad");
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte spara lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Redigera lead" : "Ny lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Kund</Label>
            <Select
              value={formState.customer_id ?? "none"}
              onValueChange={(value) =>
                handleChange("customer_id", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj kund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen kund kopplad</SelectItem>
                {sortedCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="job_type">Typ av jobb *</Label>
              <Input
                id="job_type"
                value={formState.job_type}
                onChange={(event) =>
                  handleChange("job_type", event.target.value)
                }
                placeholder="Ex. Elinstallation"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (SEK)</Label>
              <Input
                id="budget"
                type="number"
                min={0}
                value={formState.budget}
                onChange={(event) => handleChange("budget", event.target.value)}
                placeholder="ex. 25000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adress</Label>
            <Input
              id="address"
              value={formState.address}
              onChange={(event) => handleChange("address", event.target.value)}
              placeholder="Var ska arbetet utföras?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              rows={4}
              value={formState.description}
              onChange={(event) =>
                handleChange("description", event.target.value)
              }
              placeholder="Sammanfatta kundens behov, dimensioner, tidsplan osv."
            />
          </div>

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
                  <SelectItem value="new">
                    {getLeadStatusLabel("new")}
                  </SelectItem>
                  <SelectItem value="qualified">
                    {getLeadStatusLabel("qualified")}
                  </SelectItem>
                  <SelectItem value="quoted">
                    {getLeadStatusLabel("quoted")}
                  </SelectItem>
                  <SelectItem value="booked">
                    {getLeadStatusLabel("booked")}
                  </SelectItem>
                  <SelectItem value="completed">
                    {getLeadStatusLabel("completed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Källa</Label>
              <Input
                value={formState.source}
                onChange={(event) => handleChange("source", event.target.value)}
                placeholder="Var kom förfrågan ifrån?"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium text-foreground">
                Kvalificerat lead
              </p>
              <p className="text-xs text-muted-foreground">
                Markera som redo för offert eller planering
              </p>
            </div>
            <Switch
              checked={formState.is_qualified}
              onCheckedChange={(value: boolean) =>
                handleChange("is_qualified", value)
              }
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
              {editing ? "Spara lead" : "Skapa lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
