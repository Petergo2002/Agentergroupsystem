"use client";

import { IconEdit, IconSearch, IconTrash } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLeadsStore, useQuotesStore } from "@/lib/store";
import { createSupabaseClient } from "@/lib/supabase";

interface QuoteListProps {
  onCreate: () => void;
  onEdit: (quoteId: string) => void;
}

const STATUS_BADGES: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export function QuoteList({ onCreate, onEdit }: QuoteListProps) {
  const [query, setQuery] = useState("");
  const quotes = useQuotesStore((state) => state.quotes);
  const leads = useLeadsStore((state) => state.leads);
  const deleteQuote = useQuotesStore((state) => state.deleteQuote);
  const setLoading = useQuotesStore((state) => state.setLoading);

  const quotesWithLead = useMemo(() => {
    return quotes.map((quote) => ({
      ...quote,
      lead: leads.find((lead) => lead.id === quote.lead_id) || null,
    }));
  }, [quotes, leads]);

  const filtered = useMemo(() => {
    return quotesWithLead.filter((quote) => {
      const haystack = [
        quote.lead?.job_type,
        quote.status,
        quote.lead?.description,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [quotesWithLead, query]);

  const handleDelete = async (quoteId: string) => {
    if (!confirm("Vill du ta bort offerten?")) return;
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", quoteId);
      if (error) throw error;
      deleteQuote(quoteId);
      toast.success("Offert borttagen");
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte ta bort offerten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Offerter</h2>
          <p className="text-sm text-muted-foreground">
            Följ upp skickade offerter och status
          </p>
        </div>
        <Button onClick={onCreate}>Ny offert</Button>
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
              Inga offerter hittades
            </h3>
            <p className="text-sm text-muted-foreground">
              Skapa en ny offert för att komma igång.
            </p>
            <Button variant="outline" onClick={onCreate}>
              Skapa offert
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((quote) => (
            <Card
              key={quote.id}
              className="border border-border/70 hover:border-primary/40"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base text-foreground">
                    {quote.lead?.job_type ?? "Offert"}
                  </CardTitle>
                  <Badge
                    className={
                      STATUS_BADGES[quote.status] ??
                      "bg-slate-100 text-slate-700"
                    }
                  >
                    {quote.status === "sent"
                      ? "Skickad"
                      : quote.status === "accepted"
                        ? "Accepterad"
                        : "Avböjd"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(quote.id)}
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(quote.id)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="text-lg font-semibold text-foreground">
                  {new Intl.NumberFormat("sv-SE", {
                    style: "currency",
                    currency: "SEK",
                    maximumFractionDigits: 0,
                  }).format(quote.total || 0)}
                </p>
                {quote.sent_at && (
                  <p>
                    Skickad{" "}
                    {new Date(quote.sent_at).toLocaleDateString("sv-SE")}
                  </p>
                )}
                {quote.valid_until && (
                  <p>
                    Giltig till{" "}
                    {new Date(quote.valid_until).toLocaleDateString("sv-SE")}
                  </p>
                )}
                {quote.lead?.description && (
                  <p className="line-clamp-3 text-xs">
                    {quote.lead.description}
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
