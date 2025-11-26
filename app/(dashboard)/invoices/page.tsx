"use client";

import { useState } from "react";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { SiteHeader } from "@/components/site-header";

export default function InvoicesPage() {
  const [open, setOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  return (
    <>
      <SiteHeader
        title="Fakturor"
        showAddButton={false}
      />
      <div className="space-y-6 p-6">
        <InvoiceList
          onCreate={() => {
            setEditingInvoiceId(null);
            setOpen(true);
          }}
          onEdit={(invoiceId) => {
            setEditingInvoiceId(invoiceId);
            setOpen(true);
          }}
        />
      </div>
      <InvoiceDialog
        open={open}
        onOpenChange={(dialogOpen) => {
          if (!dialogOpen) setEditingInvoiceId(null);
          setOpen(dialogOpen);
        }}
        invoiceId={editingInvoiceId ?? undefined}
      />
    </>
  );
}
