"use client";

import { IconEdit, IconSearch, IconTrash } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useInvoicesStore, useLeadsStore } from "@/lib/store";
import { createSupabaseClient } from "@/lib/supabase";

interface InvoiceListProps {
  onCreate: () => void;
  onEdit: (invoiceId: string) => void;
}

const STATUS_BADGES: Record<string, string> = {
  unpaid: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
};

const SEK = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 0,
});

export function InvoiceList({ onCreate, onEdit }: InvoiceListProps) {
  const [query, setQuery] = useState("");
  const invoices = useInvoicesStore((state) => state.invoices);
  const leads = useLeadsStore((state) => state.leads);
  const deleteInvoice = useInvoicesStore((state) => state.deleteInvoice);
  const setLoading = useInvoicesStore((state) => state.setLoading);

  const invoicesWithLead = useMemo(() => {
    return invoices.map((invoice) => ({
      ...invoice,
      lead: leads.find((lead) => lead.id === invoice.lead_id) || null,
    }));
  }, [invoices, leads]);

  const filtered = useMemo(() => {
    return invoicesWithLead.filter((invoice) => {
      const haystack = [invoice.lead?.job_type, invoice.status]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [invoicesWithLead, query]);

  const handleDelete = async (invoiceId: string) => {
    if (!confirm("Vill du ta bort fakturan?")) return;
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId);
      if (error) throw error;
      deleteInvoice(invoiceId);
      toast.success("Faktura borttagen");
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte ta bort fakturan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Fakturor</h2>
          <p className="text-sm text-muted-foreground">
            Hantera utskick, betalstatus och förfallna belopp
          </p>
        </div>
        <Button onClick={onCreate}>Ny faktura</Button>
      </div>

      <div className="relative">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Sök på jobb eller status"
          className="pl-9"
        />
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <IconSearch className="h-8 w-8 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground">
              Inga fakturor hittades
            </h3>
            <p className="text-sm text-muted-foreground">
              Registrera en faktura för att börja spåra kassaflöde.
            </p>
            <Button variant="outline" onClick={onCreate}>
              Skapa faktura
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((invoice) => (
            <Card
              key={invoice.id}
              className="border border-border/70 hover:border-primary/40"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base text-foreground">
                    {invoice.lead?.job_type ?? "Faktura"}
                  </CardTitle>
                  <Badge
                    className={
                      STATUS_BADGES[invoice.status] ??
                      "bg-slate-100 text-slate-700"
                    }
                  >
                    {invoice.status === "paid"
                      ? "Betald"
                      : invoice.status === "overdue"
                        ? "Förfallen"
                        : "Obetald"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(invoice.id)}
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(invoice.id)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="text-lg font-semibold text-foreground">
                  {SEK.format(invoice.amount || 0)}
                </p>
                {invoice.due_date && (
                  <p>
                    Förfaller{" "}
                    {new Date(invoice.due_date).toLocaleDateString("sv-SE")}
                  </p>
                )}
                {invoice.status === "paid" && invoice.created_at && (
                  <p>
                    Betalt{" "}
                    {new Date(invoice.created_at).toLocaleDateString("sv-SE")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
