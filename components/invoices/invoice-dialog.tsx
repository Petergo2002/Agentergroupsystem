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
import { useInvoicesStore, useLeadsStore } from "@/lib/store";
import { createSupabaseClient } from "@/lib/supabase";

type InvoiceFormState = {
  lead_id: string | null;
  amount: string;
  due_date: string;
  status: "unpaid" | "paid" | "overdue";
};

const DEFAULT_STATE: InvoiceFormState = {
  lead_id: null,
  amount: "",
  due_date: "",
  status: "unpaid",
};

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId?: string | null;
}

export function InvoiceDialog({
  open,
  onOpenChange,
  invoiceId,
}: InvoiceDialogProps) {
  const { invoices, addInvoice, updateInvoice, setLoading } =
    useInvoicesStore();
  const leads = useLeadsStore((state) => state.leads);
  const editing = Boolean(invoiceId);
  const existingInvoice = invoices.find((invoice) => invoice.id === invoiceId);
  const [formState, setFormState] = useState<InvoiceFormState>(DEFAULT_STATE);

  useEffect(() => {
    if (!open) {
      setFormState(DEFAULT_STATE);
      return;
    }

    if (editing && existingInvoice) {
      setFormState({
        lead_id: existingInvoice.lead_id,
        amount: existingInvoice.amount?.toString() ?? "",
        due_date: existingInvoice.due_date
          ? existingInvoice.due_date.slice(0, 16)
          : "",
        status: existingInvoice.status,
      });
    } else {
      setFormState(DEFAULT_STATE);
    }
  }, [editing, existingInvoice, open]);

  const handleChange = (
    field: keyof InvoiceFormState,
    value: string | null,
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value ?? "" }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.amount) {
      toast.error("Ange belopp");
      return;
    }

    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      const payload = {
        lead_id: formState.lead_id,
        amount: Number(formState.amount),
        due_date: formState.due_date
          ? new Date(formState.due_date).toISOString()
          : null,
        status: formState.status,
        created_at: existingInvoice?.created_at,
      };

      if (editing && invoiceId) {
        const { data, error } = await supabase
          .from("invoices")
          .update(payload)
          .eq("id", invoiceId)
          .select()
          .single();
        if (error) throw error;
        updateInvoice(invoiceId, data);
        toast.success("Faktura uppdaterad");
      } else {
        const { data, error } = await supabase
          .from("invoices")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        addInvoice(data);
        toast.success("Faktura skapad");
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte spara fakturan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Redigera faktura" : "Ny faktura"}
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
                <SelectItem value="none">Fristående faktura</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.job_type ?? "Lead"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Belopp (SEK) *</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                value={formState.amount}
                onChange={(event) => handleChange("amount", event.target.value)}
                required
              />
            </div>
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
                  <SelectItem value="unpaid">Obetald</SelectItem>
                  <SelectItem value="paid">Betald</SelectItem>
                  <SelectItem value="overdue">Förfallen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Förfallodatum</Label>
            <Input
              id="due_date"
              type="datetime-local"
              value={formState.due_date}
              onChange={(event) => handleChange("due_date", event.target.value)}
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
              {editing ? "Spara faktura" : "Skapa faktura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
