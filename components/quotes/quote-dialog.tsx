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
import { useLeadsStore, useQuotesStore } from "@/lib/store";
import { createSupabaseClient } from "@/lib/supabase";

type QuoteFormState = {
  lead_id: string | null;
  total: string;
  status: "sent" | "accepted" | "rejected";
  sent_at: string;
  valid_until: string;
};

const DEFAULT_STATE: QuoteFormState = {
  lead_id: null,
  total: "",
  status: "sent",
  sent_at: "",
  valid_until: "",
};

interface QuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId?: string | null;
}

export function QuoteDialog({ open, onOpenChange, quoteId }: QuoteDialogProps) {
  const { quotes, addQuote, updateQuote, setLoading } = useQuotesStore();
  const leads = useLeadsStore((state) => state.leads);
  const editing = Boolean(quoteId);
  const existingQuote = quotes.find((quote) => quote.id === quoteId);
  const [formState, setFormState] = useState<QuoteFormState>(DEFAULT_STATE);

  useEffect(() => {
    if (!open) {
      setFormState(DEFAULT_STATE);
      return;
    }

    if (editing && existingQuote) {
      setFormState({
        lead_id: existingQuote.lead_id,
        total: existingQuote.total?.toString() ?? "",
        status: existingQuote.status,
        sent_at: existingQuote.sent_at
          ? existingQuote.sent_at.slice(0, 16)
          : "",
        valid_until: existingQuote.valid_until
          ? existingQuote.valid_until.slice(0, 16)
          : "",
      });
    } else {
      setFormState(DEFAULT_STATE);
    }
  }, [editing, existingQuote, open]);

  const handleChange = (field: keyof QuoteFormState, value: string | null) => {
    setFormState((prev) => ({ ...prev, [field]: value ?? "" }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.total) {
      toast.error("Ange en totalsumma");
      return;
    }

    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      const payload = {
        lead_id: formState.lead_id,
        total: Number(formState.total),
        status: formState.status,
        sent_at: formState.sent_at
          ? new Date(formState.sent_at).toISOString()
          : null,
        valid_until: formState.valid_until
          ? new Date(formState.valid_until).toISOString()
          : null,
      };

      if (editing && quoteId) {
        const { data, error } = await supabase
          .from("quotes")
          .update(payload)
          .eq("id", quoteId)
          .select()
          .single();
        if (error) throw error;
        updateQuote(quoteId, data);
        toast.success("Offert uppdaterad");
      } else {
        const { data, error } = await supabase
          .from("quotes")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        addQuote(data);
        toast.success("Offert skapad");
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte spara offerten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Redigera offert" : "Ny offert"}</DialogTitle>
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
                <SelectItem value="none">Fristående offert</SelectItem>
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
              <Label htmlFor="total">Belopp (SEK) *</Label>
              <Input
                id="total"
                type="number"
                min={0}
                value={formState.total}
                onChange={(event) => handleChange("total", event.target.value)}
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
                  <SelectItem value="sent">Skickad</SelectItem>
                  <SelectItem value="accepted">Accepterad</SelectItem>
                  <SelectItem value="rejected">Avböjd</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sent_at">Skickad</Label>
              <Input
                id="sent_at"
                type="datetime-local"
                value={formState.sent_at}
                onChange={(event) =>
                  handleChange("sent_at", event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Giltig till</Label>
              <Input
                id="valid_until"
                type="datetime-local"
                value={formState.valid_until}
                onChange={(event) =>
                  handleChange("valid_until", event.target.value)
                }
              />
            </div>
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
              {editing ? "Spara offert" : "Skapa offert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
