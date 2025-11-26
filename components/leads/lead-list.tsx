"use client";

import {
  IconCoins,
  IconEdit,
  IconMapPin,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { useCustomersStore, useLeadsStore } from "@/lib/store";
import { createSupabaseClient } from "@/lib/supabase";
import { getLeadStatusBadge, getLeadStatusLabel } from "@/lib/types/contractor";

interface LeadListProps {
  onCreateLead: () => void;
  onEditLead: (leadId: string) => void;
}

export function LeadList({ onCreateLead, onEditLead }: LeadListProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [query, setQuery] = useState("");
  const leads = useLeadsStore((state) => state.leads);
  const customers = useCustomersStore((state) => state.customers);
  const deleteLead = useLeadsStore((state) => state.deleteLead);
  const setLoading = useLeadsStore((state) => state.setLoading);

  const enrichedLeads = useMemo(() => {
    return leads.map((lead) => ({
      ...lead,
      customer: customers.find((customer) => customer.id === lead.customer_id),
    }));
  }, [leads, customers]);

  const filteredLeads = useMemo(() => {
    return enrichedLeads.filter((lead) => {
      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;
      const haystack = [
        lead.customer?.name,
        lead.job_type,
        lead.description,
        lead.address,
        lead.source,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = haystack.includes(query.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [enrichedLeads, statusFilter, query]);

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Vill du ta bort leadet?")) return;
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      const { error } = await supabase.from("leads").delete().eq("id", leadId);
      if (error) throw error;
      deleteLead(leadId);
      toast.success("Lead borttaget");
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte ta bort lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Samla in offerter och förfrågningar från kunder
          </p>
        </div>
        <Button onClick={onCreateLead}>Skapa lead</Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sök efter jobbtyp, kund eller adress"
            className="pl-9"
          />
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrera på status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statusar</SelectItem>
            <SelectItem value="new">Ny förfrågan</SelectItem>
            <SelectItem value="qualified">Kvalificerad</SelectItem>
            <SelectItem value="quoted">Offert skickad</SelectItem>
            <SelectItem value="booked">Jobb bokat</SelectItem>
            <SelectItem value="completed">Klart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredLeads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <IconSearch className="h-8 w-8 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground">
              Inga leads hittades
            </h3>
            <p className="text-sm text-muted-foreground">
              {query
                ? "Justera sökningen och försök igen."
                : "När leads kommer in från webben eller telefon visas de här."}
            </p>
            <Button variant="outline" onClick={onCreateLead} className="mt-2">
              Registrera lead
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredLeads.map((lead) => (
            <Card
              key={lead.id}
              className="border border-border/70 hover:border-primary/40"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-base text-foreground">
                    {lead.job_type || "Okänd tjänst"}
                  </CardTitle>
                  {lead.customer && (
                    <p className="text-xs text-muted-foreground">
                      Kontakt: {lead.customer.name}
                    </p>
                  )}
                  <Badge className={getLeadStatusBadge(lead.status ?? "new")}>
                    {getLeadStatusLabel(lead.status ?? "new")}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEditLead(lead.id)}
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteLead(lead.id)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {lead.address && (
                  <p className="flex items-center gap-2 text-xs">
                    <IconMapPin className="h-4 w-4 text-muted-foreground" />
                    {lead.address}
                  </p>
                )}
                {lead.budget && (
                  <p className="flex items-center gap-2 text-xs">
                    <IconCoins className="h-4 w-4 text-muted-foreground" />
                    Budget {new Intl.NumberFormat("sv-SE").format(lead.budget)}{" "}
                    kr
                  </p>
                )}
                {lead.description && (
                  <p className="line-clamp-3 text-xs">{lead.description}</p>
                )}
                {lead.source && (
                  <p className="text-xs text-muted-foreground">
                    Källa: {lead.source}
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
