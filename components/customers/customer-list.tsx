"use client";

import { IconEdit, IconSearch, IconTrash } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCustomersStore } from "@/lib/store";
import { createSupabaseClient } from "@/lib/supabase";

interface CustomerListProps {
  onCreate: () => void;
  onEdit: (customerId: string) => void;
}

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospekt",
  active: "Aktiv",
  repeat: "Återkommande",
  inactive: "Avslutad",
};

const STAGE_COLORS: Record<string, string> = {
  prospect: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  repeat: "bg-blue-100 text-blue-700",
  inactive: "bg-amber-100 text-amber-700",
};

export function CustomerList({ onCreate, onEdit }: CustomerListProps) {
  const [query, setQuery] = useState("");
  const customers = useCustomersStore((state) => state.customers);
  const deleteCustomer = useCustomersStore((state) => state.deleteCustomer);
  const setLoading = useCustomersStore((state) => state.setLoading);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return customers.filter((customer) => {
      const haystack = [
        customer.name,
        customer.company,
        customer.email,
        customer.phone,
        customer.service_area,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [customers, query]);

  const stats = useMemo(() => {
    const stageCount = customers.reduce<Record<string, number>>(
      (acc, customer) => {
        const stage = customer.lifecycle_stage ?? "prospect";
        acc[stage] = (acc[stage] ?? 0) + 1;
        return acc;
      },
      {},
    );
    return stageCount;
  }, [customers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort kunden?")) return;
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
      deleteCustomer(id);
      toast.success("Kund borttagen");
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte ta bort kunden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Kunder</h2>
          <p className="text-sm text-muted-foreground">
            Få överblick över serviceavtal och relationer
          </p>
        </div>
        <Button onClick={onCreate}>Ny kund</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Object.entries(stats).map(([stage, count]) => (
          <Card key={stage} className="border border-border/60">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Status
                </p>
                <p className="text-sm font-medium text-foreground">
                  {STAGE_LABELS[stage] ?? stage}
                </p>
              </div>
              <span className="text-2xl font-semibold text-foreground">
                {count}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Sök på namn, ort, företag..."
          className="pl-9"
        />
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <IconSearch className="h-8 w-8 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground">
              Inga kunder hittades
            </h3>
            <p className="text-sm text-muted-foreground">
              {query
                ? "Justera din sökning för att hitta rätt kund."
                : "Lägg till din första kund för att komma igång."}
            </p>
            {!query && (
              <Button variant="outline" onClick={onCreate} className="mt-2">
                Lägg till kund
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((customer) => (
            <Card
              key={customer.id}
              className="border border-border/70 hover:border-primary/40"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base text-foreground">
                    {customer.name}
                  </CardTitle>
                  {customer.company && (
                    <p className="text-xs text-muted-foreground">
                      {customer.company}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(customer.id)}
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(customer.id)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex flex-wrap gap-2">
                  {customer.lifecycle_stage && (
                    <Badge
                      className={
                        STAGE_COLORS[customer.lifecycle_stage] ??
                        "bg-slate-100 text-slate-700"
                      }
                    >
                      {STAGE_LABELS[customer.lifecycle_stage] ??
                        customer.lifecycle_stage}
                    </Badge>
                  )}
                  {customer.customer_type && (
                    <Badge variant="outline">
                      {customer.customer_type === "residential"
                        ? "Privat"
                        : customer.customer_type === "commercial"
                          ? "Företag"
                          : "Offentlig"}
                    </Badge>
                  )}
                  {customer.channel && (
                    <Badge variant="secondary">
                      {customer.channel === "web"
                        ? "Webb"
                        : customer.channel === "referral"
                          ? "Rekommendation"
                          : customer.channel.toUpperCase()}
                    </Badge>
                  )}
                </div>
                {customer.service_area && (
                  <p className="text-sm font-medium text-foreground">
                    {customer.service_area}
                  </p>
                )}
                <div className="space-y-1 text-xs">
                  {customer.email && <p>E-post: {customer.email}</p>}
                  {customer.phone && <p>Telefon: {customer.phone}</p>}
                </div>
                {customer.notes && (
                  <p className="text-xs italic text-muted-foreground">
                    {customer.notes}
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
