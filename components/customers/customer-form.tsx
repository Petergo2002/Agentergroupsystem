"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { useCustomersStore } from "@/lib/store";
import { createSupabaseClient } from "@/lib/supabase";

const CUSTOMER_TYPES = [
  { value: "residential", label: "Privatkund" },
  { value: "commercial", label: "Företag" },
  { value: "public-sector", label: "Offentlig sektor" },
] as const;

const CHANNELS = [
  { value: "phone", label: "Telefon" },
  { value: "email", label: "E-post" },
  { value: "sms", label: "SMS" },
  { value: "web", label: "Webbformulär" },
  { value: "referral", label: "Rekommendation" },
] as const;

const LIFECYCLE = [
  { value: "prospect", label: "Prospekt" },
  { value: "active", label: "Aktiv kund" },
  { value: "repeat", label: "Återkommande" },
  { value: "inactive", label: "Avslutad" },
] as const;

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  service_area: string;
  customer_type: (typeof CUSTOMER_TYPES)[number]["value"];
  channel: (typeof CHANNELS)[number]["value"];
  lifecycle_stage: (typeof LIFECYCLE)[number]["value"];
  notes: string;
};

const DEFAULT_STATE: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  service_area: "",
  customer_type: "residential",
  channel: "phone",
  lifecycle_stage: "prospect",
  notes: "",
};

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string | null;
}

export function CustomerForm({
  open,
  onOpenChange,
  customerId,
}: CustomerFormProps) {
  const { customers, addCustomer, updateCustomer, setLoading } =
    useCustomersStore();
  const editing = Boolean(customerId);
  const existing = customers.find((customer) => customer.id === customerId);
  const [formState, setFormState] = useState<FormState>(DEFAULT_STATE);

  useEffect(() => {
    if (!open) {
      setFormState(DEFAULT_STATE);
      return;
    }

    if (editing && existing) {
      setFormState({
        name: existing.name || "",
        email: existing.email || "",
        phone: existing.phone || "",
        company: existing.company || "",
        service_area: existing.service_area || "",
        customer_type:
          (existing.customer_type as FormState["customer_type"]) ||
          "residential",
        channel: (existing.channel as FormState["channel"]) || "phone",
        lifecycle_stage:
          (existing.lifecycle_stage as FormState["lifecycle_stage"]) ||
          "prospect",
        notes: existing.notes || "",
      });
    } else {
      setFormState(DEFAULT_STATE);
    }
  }, [editing, existing, open]);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      toast.error("Namn krävs");
      return;
    }

    try {
      setLoading(true);
      const supabase = createSupabaseClient();

      if (editing && customerId) {
        const { data, error } = await supabase
          .from("contacts")
          .update({
            name: formState.name.trim(),
            email: formState.email.trim() || null,
            phone: formState.phone.trim() || null,
            company: formState.company.trim() || null,
            service_area: formState.service_area.trim() || null,
            customer_type: formState.customer_type,
            channel: formState.channel,
            lifecycle_stage: formState.lifecycle_stage,
            preferred_contact_method: formState.channel,
            notes: formState.notes.trim() || null,
          })
          .eq("id", customerId)
          .select()
          .single();

        if (error) throw error;

        updateCustomer(customerId, data);
        toast.success("Kund uppdaterad");
      } else {
        const { data, error } = await supabase
          .from("contacts")
          .insert({
            name: formState.name.trim(),
            email: formState.email.trim() || null,
            phone: formState.phone.trim() || null,
            company: formState.company.trim() || null,
            service_area: formState.service_area.trim() || null,
            customer_type: formState.customer_type,
            channel: formState.channel,
            lifecycle_stage: formState.lifecycle_stage,
            preferred_contact_method: formState.channel,
            notes: formState.notes.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;

        addCustomer(data);
        toast.success("Kund skapad");
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte spara kund");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Redigera kund" : "Ny kund"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Namn *</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="Ex. Anna Andersson"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Bolag</Label>
              <Input
                id="company"
                value={formState.company}
                onChange={(event) =>
                  handleChange("company", event.target.value)
                }
                placeholder="Företagsnamn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="kund@example.se"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formState.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                placeholder="+46..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Kundtyp</Label>
              <Select
                value={formState.customer_type}
                onValueChange={(value) => handleChange("customer_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Typ av kund" />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kanal</Label>
              <Select
                value={formState.channel}
                onValueChange={(value) => handleChange("channel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hur kom kunden in?" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formState.lifecycle_stage}
                onValueChange={(value) =>
                  handleChange("lifecycle_stage", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj status" />
                </SelectTrigger>
                <SelectContent>
                  {LIFECYCLE.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_area">Område / behov</Label>
            <Input
              id="service_area"
              value={formState.service_area}
              onChange={(event) =>
                handleChange("service_area", event.target.value)
              }
              placeholder="Ex. Elinstallation i Göteborg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Noteringar</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formState.notes}
              onChange={(event) => handleChange("notes", event.target.value)}
              placeholder="Sammanfatta kundens förväntningar, avtal eller viktiga detaljer."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button type="submit">{editing ? "Spara" : "Skapa kund"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
