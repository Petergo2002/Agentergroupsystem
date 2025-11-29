"use client";

import { useState } from "react";
import { CustomerForm } from "@/components/customers/customer-form";
import { CustomerList } from "@/components/customers/customer-list";
import { SiteHeader } from "@/components/site-header";

export default function CustomersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );

  return (
    <>
      <SiteHeader title="Kunder" showAddButton={false} />
      <div className="space-y-6 p-6">
        <CustomerList
          onCreate={() => {
            setEditingCustomerId(null);
            setFormOpen(true);
          }}
          onEdit={(customerId) => {
            setEditingCustomerId(customerId);
            setFormOpen(true);
          }}
        />
      </div>
      <CustomerForm
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) setEditingCustomerId(null);
          setFormOpen(open);
        }}
        customerId={editingCustomerId ?? undefined}
      />
    </>
  );
}
