"use client";

import { useState } from "react";
import { QuoteDialog } from "@/components/quotes/quote-dialog";
import { QuoteList } from "@/components/quotes/quote-list";
import { SiteHeader } from "@/components/site-header";

export default function QuotesPage() {
  const [open, setOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  return (
    <>
      <SiteHeader title="Offerter" showAddButton={false} />
      <div className="space-y-6 p-6">
        <QuoteList
          onCreate={() => {
            setEditingQuoteId(null);
            setOpen(true);
          }}
          onEdit={(quoteId) => {
            setEditingQuoteId(quoteId);
            setOpen(true);
          }}
        />
      </div>
      <QuoteDialog
        open={open}
        onOpenChange={(dialogOpen) => {
          if (!dialogOpen) setEditingQuoteId(null);
          setOpen(dialogOpen);
        }}
        quoteId={editingQuoteId ?? undefined}
      />
    </>
  );
}
