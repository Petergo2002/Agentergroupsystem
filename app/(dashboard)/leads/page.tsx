"use client";

import { useState } from "react";
import { LeadDialog } from "@/components/leads/lead-dialog";
import { LeadList } from "@/components/leads/lead-list";
import { SiteHeader } from "@/components/site-header";

export default function LeadsPage() {
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

  return (
    <>
      <SiteHeader title="Leads" showAddButton={false} />
      <div className="space-y-6 p-6">
        <LeadList
          onCreateLead={() => {
            setEditingLeadId(null);
            setLeadDialogOpen(true);
          }}
          onEditLead={(leadId) => {
            setEditingLeadId(leadId);
            setLeadDialogOpen(true);
          }}
        />
      </div>
      <LeadDialog
        open={leadDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingLeadId(null);
          }
          setLeadDialogOpen(open);
        }}
        leadId={editingLeadId ?? undefined}
      />
    </>
  );
}
