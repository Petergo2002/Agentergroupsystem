// Contractor domain types and helpers

export type CustomerChannel = "phone" | "email" | "sms" | "web" | "referral";
export type CustomerType = "residential" | "commercial" | "public-sector";
export type CustomerLifecycle = "prospect" | "active" | "repeat" | "inactive";

export type LeadStatus =
  | "new"
  | "qualified"
  | "quoted"
  | "booked"
  | "completed";
export type JobStatus = "scheduled" | "in_progress" | "done";
export type QuoteStatus = "sent" | "accepted" | "rejected";
export type InvoiceStatus = "unpaid" | "paid" | "overdue";

export interface Customer {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  channel?: CustomerChannel | null;
  customer_type?: CustomerType | null;
  lifecycle_stage?: CustomerLifecycle | null;
  service_area?: string | null;
  preferred_contact_method?: CustomerChannel | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  customer_id: string | null;
  job_type?: string | null;
  description?: string | null;
  address?: string | null;
  budget?: number | null;
  source?: string | null;
  is_qualified: boolean;
  status: LeadStatus;
  created_at: string;
}

export interface Job {
  id: string;
  organization_id: string;
  lead_id: string | null;
  assigned_to: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status: JobStatus;
  notes?: string | null;
  materials?: Record<string, any> | null;
  cost_estimate?: number | null;
  price_estimate?: number | null;
  created_at: string;
}

export interface Quote {
  id: string;
  lead_id: string;
  total: number;
  status: QuoteStatus;
  sent_at?: string | null;
  accepted_at?: string | null;
  valid_until?: string | null;
  line_items?:
    | { description: string; quantity: number; unit_price: number }[]
    | null;
}

export interface Invoice {
  id: string;
  lead_id: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  created_at: string;
  paid_at?: string | null;
}

export function getLeadStatusLabel(status: LeadStatus): string {
  const labels: Record<LeadStatus, string> = {
    new: "Ny förfrågan",
    qualified: "Kvalificerad",
    quoted: "Offert skickad",
    booked: "Jobb bokat",
    completed: "Avslutat",
  };
  return labels[status];
}

export function getLeadStatusBadge(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    new: "bg-slate-100 text-slate-800",
    qualified: "bg-blue-100 text-blue-800",
    quoted: "bg-amber-100 text-amber-800",
    booked: "bg-emerald-100 text-emerald-800",
    completed: "bg-purple-100 text-purple-800",
  };
  return colors[status];
}

export function getJobStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    scheduled: "Planerat",
    in_progress: "Pågående",
    done: "Slutfört",
  };
  return labels[status];
}

export function calculateJobMargin(price: number, cost: number): number {
  if (!price || price <= 0) return 0;
  const margin = ((price - (cost || 0)) / price) * 100;
  return Math.round(margin * 10) / 10;
}

export function estimateJobDurationHours(
  start?: string | null,
  end?: string | null,
): number | null {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) return null;
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
}
