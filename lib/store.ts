import { create } from "zustand";
import type { AuthUser } from "./auth";
import type { Database } from "./database.types";
import {
  mockReportSections,
  mockReports,
  mockReportTemplates,
} from "./mocks/rapport";
import {
  useReportSectionsStore as _useReportSectionsStore,
  useReportsStore as _useReportsStore,
  useReportTemplatesStore as _useReportTemplatesStore,
  useReportById,
  useReportSummaries,
  useReportSummaryById,
  // A6: Summary store
  useReportSummaryStore,
  // A1: Selectors
  useReports,
  useReportsInitialized,
  useReportsLoading,
  useSectionById,
  useSections,
  useSectionsInitialized,
  useSectionsLoading,
  useTemplateById,
  useTemplates,
  useTemplatesInitialized,
  useTemplatesLoading,
} from "./stores/rapportStores";
import { createSupabaseClient, IS_DEMO_MODE } from "./supabase";
import type {
  Report,
  ReportSectionDefinition,
  ReportSectionType,
  ReportTemplate,
} from "./types/rapport";

export const useReportsStore = _useReportsStore;
export const useReportTemplatesStore = _useReportTemplatesStore;
export const useReportSectionsStore = _useReportSectionsStore;

// A1: Re-export selectors
export {
  useReports,
  useReportsLoading,
  useReportsInitialized,
  useReportById,
  useTemplates,
  useTemplatesLoading,
  useTemplatesInitialized,
  useTemplateById,
  useSections,
  useSectionsLoading,
  useSectionsInitialized,
  useSectionById,
  // A6: Summary store
  useReportSummaryStore,
  useReportSummaries,
  useReportSummaryById,
};

// CRM row types - derived from Database types for consistency
// Note: Some stores use slightly different field names for legacy compatibility
type CustomerRow = Database["public"]["Tables"]["contacts"]["Row"];
type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
type QuoteRow = Database["public"]["Tables"]["quotes"]["Row"];
type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
type ReportTemplateRow =
  Database["public"]["Tables"]["report_templates"]["Row"];
type ReportSectionRow = Database["public"]["Tables"]["report_sections"]["Row"];

interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
}

interface CustomersStore {
  customers: CustomerRow[];
  loading: boolean;
  setCustomers: (customers: CustomerRow[]) => void;
  addCustomer: (customer: CustomerRow) => void;
  updateCustomer: (id: string, updates: Partial<CustomerRow>) => void;
  deleteCustomer: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

interface LeadsStore {
  leads: LeadRow[];
  loading: boolean;
  setLeads: (leads: LeadRow[]) => void;
  addLead: (lead: LeadRow) => void;
  updateLead: (id: string, updates: Partial<LeadRow>) => void;
  deleteLead: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

interface JobsStore {
  jobs: JobRow[];
  loading: boolean;
  setJobs: (jobs: JobRow[]) => void;
  addJob: (job: JobRow) => void;
  updateJob: (id: string, updates: Partial<JobRow>) => void;
  deleteJob: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

interface QuotesStore {
  quotes: QuoteRow[];
  loading: boolean;
  setQuotes: (quotes: QuoteRow[]) => void;
  addQuote: (quote: QuoteRow) => void;
  updateQuote: (id: string, updates: Partial<QuoteRow>) => void;
  deleteQuote: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

interface InvoicesStore {
  invoices: InvoiceRow[];
  loading: boolean;
  setInvoices: (invoices: InvoiceRow[]) => void;
  addInvoice: (invoice: InvoiceRow) => void;
  updateInvoice: (id: string, updates: Partial<InvoiceRow>) => void;
  deleteInvoice: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

interface EventsStore {
  events: EventRow[];
  loading: boolean;
  selectedDate: Date;
  viewMode: "month" | "week" | "day";
  setEvents: (events: EventRow[]) => void;
  addEvent: (event: EventRow) => void;
  updateEvent: (id: string, updates: Partial<EventRow>) => void;
  deleteEvent: (id: string) => void;
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: "month" | "week" | "day") => void;
  setLoading: (loading: boolean) => void;
}

interface TasksStore {
  tasks: TaskRow[];
  loading: boolean;
  setTasks: (tasks: TaskRow[]) => void;
  addTask: (task: TaskRow) => void;
  updateTask: (id: string, updates: Partial<TaskRow>) => void;
  deleteTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

interface CreateReportInput {
  title: string;
  templateId: string;
  trade: Report["type"];
  metadata: Partial<Report["metadata"]> & { client: string; location: string };
  priority?: Report["metadata"]["priority"];
  status?: Report["status"];
  sections?: Report["sections"];
  checklist?: Report["checklist"];
  assets?: Report["assets"];
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));

export const useCustomersStore = create<CustomersStore>((set) => ({
  customers: [],
  loading: false,
  setCustomers: (customers) => set({ customers }),
  addCustomer: (customer) =>
    set((state) => ({ customers: [...state.customers, customer] })),
  updateCustomer: (id, updates) =>
    set((state) => ({
      customers: state.customers.map((customer) =>
        customer.id === id ? { ...customer, ...updates } : customer,
      ),
    })),
  deleteCustomer: (id) =>
    set((state) => ({
      customers: state.customers.filter((customer) => customer.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}));

export const useLeadsStore = create<LeadsStore>((set) => ({
  leads: [],
  loading: false,
  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [...state.leads, lead] })),
  updateLead: (id, updates) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === id ? { ...lead, ...updates } : lead,
      ),
    })),
  deleteLead: (id) =>
    set((state) => ({
      leads: state.leads.filter((lead) => lead.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}));

export const useJobsStore = create<JobsStore>((set) => ({
  jobs: [],
  loading: false,
  setJobs: (jobs) => set({ jobs }),
  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, ...updates } : job,
      ),
    })),
  deleteJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}));

export const useQuotesStore = create<QuotesStore>((set) => ({
  quotes: [],
  loading: false,
  setQuotes: (quotes) => set({ quotes }),
  addQuote: (quote) => set((state) => ({ quotes: [...state.quotes, quote] })),
  updateQuote: (id, updates) =>
    set((state) => ({
      quotes: state.quotes.map((quote) =>
        quote.id === id ? { ...quote, ...updates } : quote,
      ),
    })),
  deleteQuote: (id) =>
    set((state) => ({
      quotes: state.quotes.filter((quote) => quote.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}));

export const useInvoicesStore = create<InvoicesStore>((set) => ({
  invoices: [],
  loading: false,
  setInvoices: (invoices) => set({ invoices }),
  addInvoice: (invoice) =>
    set((state) => ({ invoices: [...state.invoices, invoice] })),
  updateInvoice: (id, updates) =>
    set((state) => ({
      invoices: state.invoices.map((invoice) =>
        invoice.id === id ? { ...invoice, ...updates } : invoice,
      ),
    })),
  deleteInvoice: (id) =>
    set((state) => ({
      invoices: state.invoices.filter((invoice) => invoice.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}));

export const useEventsStore = create<EventsStore>((set) => ({
  events: [],
  loading: false,
  selectedDate: new Date(),
  viewMode: "month",
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === id ? { ...event, ...updates } : event,
      ),
    })),
  deleteEvent: (id) =>
    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    })),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setViewMode: (viewMode) => set({ viewMode }),
  setLoading: (loading) => set({ loading }),
}));

export const useTasksStore = create<TasksStore>((set) => ({
  tasks: [],
  loading: false,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task,
      ),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}));

// Data fetching helpers
export const fetchCustomers = async () => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("name");

  if (error) throw error;
  const mapped = (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id ?? null,
    organization_id: row.organization_id ?? null,
    name: row.name,
    email: row.email ?? null,
    phone: row.phone ?? null,
    company: row.company ?? null,
    notes: row.notes ?? null,
    channel: row.channel ?? null,
    customer_type: row.customer_type ?? null,
    lifecycle_stage: row.lifecycle_stage ?? null,
    service_area: row.service_area ?? null,
    preferred_contact_method: row.preferred_contact_method ?? null,
    tags: row.tags ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
    is_lead: row.is_lead ?? null,
    lead_quality: row.lead_quality ?? null,
    lead_source: row.lead_source ?? null,
    budget_min: row.budget_min ?? null,
    budget_max: row.budget_max ?? null,
    property_type: row.property_type ?? null,
    bedrooms_min: row.bedrooms_min ?? null,
    bathrooms_min: row.bathrooms_min ?? null,
    location_preference: row.location_preference ?? null,
    timeline: row.timeline ?? null,
    financing_status: row.financing_status ?? null,
    current_home_owner: row.current_home_owner ?? null,
    motivation_score: row.motivation_score ?? null,
  })) as CustomerRow[];
  return mapped;
};

export const fetchLeads = async () => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, customers(name, phone)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as LeadRow[];
};

export const fetchJobs = async () => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, leads(id, job_type, status), users(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as JobRow[];
};

export const fetchQuotes = async () => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*, leads(job_type, status)")
    .order("sent_at", { ascending: false });

  if (error) throw error;
  return data as QuoteRow[];
};

export const fetchInvoices = async () => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, leads(job_type, status)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as InvoiceRow[];
};

const DEFAULT_REPORT_METADATA: Report["metadata"] = {
  client: "",
  location: "",
  projectReference: "",
  assignedTo: "",
  scheduledAt: "",
  dueAt: "",
  priority: "medium",
};

const normalizeTemplateSections = (
  sections: any[] | null | undefined,
): ReportTemplate["sections"] => {
  if (!Array.isArray(sections)) return [];
  return sections.map((section, index) => {
    if (section && typeof section === "object") {
      const fallbackTitle =
        section.title ?? section?.fields?.[0]?.label ?? `Sektion ${index + 1}`;
      return {
        id: section.id ?? section?.fields?.[0]?.id ?? randomId(),
        title: fallbackTitle,
        description:
          section.description ?? section.prefill ?? section.summary ?? "",
        type: section.type ?? "text",
      };
    }
    return {
      id: randomId(),
      title: `Sektion ${index + 1}`,
      description: "",
      type: "text",
    };
  });
};

const normalizeReportSections = (
  sections: any[] | null | undefined,
): Report["sections"] => {
  if (!Array.isArray(sections)) return [];
  return sections.map((section, index) => {
    if (section && typeof section === "object") {
      const content =
        typeof section.content === "string"
          ? section.content
          : Array.isArray(section.fields)
            ? section.fields
                .map((field: any) =>
                  `${field.label ?? ""}${field.value ? `: ${field.value}` : ""}`.trim(),
                )
                .filter(Boolean)
                .join("\n")
            : (section.summary ?? "");
      return {
        id: section.id ?? section?.fields?.[0]?.id ?? randomId(),
        title:
          section.title ??
          section?.fields?.[0]?.label ??
          `Sektion ${index + 1}`,
        hint:
          section.hint ?? section.description ?? section.summary ?? undefined,
        content,
        status: section.status === "completed" ? "completed" : "pending",
        type: section.type ?? "text",
        assetIds: section.assetIds ?? undefined,
        assetId: section.assetId ?? undefined,
        annotationData: section.annotationData ?? undefined,
        annotatedImageUrl: section.annotatedImageUrl ?? undefined,
      };
    }
    return {
      id: randomId(),
      title: `Sektion ${index + 1}`,
      content: "",
      status: "pending",
      type: "text",
    };
  });
};

const mapReportTemplateRow = (row: ReportTemplateRow): ReportTemplate => ({
  id: row.id,
  name: row.name,
  trade: (row.trade ?? "bygg") as ReportTemplate["trade"],
  description: row.description ?? undefined,
  version: row.version ?? undefined,
  designId: (row.design_id as ReportTemplate["designId"]) ?? undefined,
  sections: normalizeTemplateSections(row.sections as any[] | null | undefined),
  checklist: (row.checklist as ReportTemplate["checklist"] | null) ?? [],
  assetGuidelines:
    (row.asset_guidelines as ReportTemplate["assetGuidelines"] | null) ?? [],
  visibilityRules:
    (row.visibility_rules as ReportTemplate["visibilityRules"] | null) ?? [],
});

export const mapReportRow = (row: ReportRow): Report => ({
  id: row.id,
  title: row.title,
  status: (row.status ?? "draft") as Report["status"],
  type: (row.trade ?? "bygg") as Report["type"],
  templateId: row.template_id ?? "",
  metadata: (() => {
    const fromRow = (row.metadata as Report["metadata"] | null) ?? {};
    const metadata = { ...DEFAULT_REPORT_METADATA, ...fromRow };
    if (!metadata.scheduledAt && row.created_at) {
      metadata.scheduledAt = row.created_at;
    }
    if (!metadata.dueAt && row.updated_at) {
      metadata.dueAt = row.updated_at;
    }
    if (row.priority) {
      metadata.priority = row.priority as Report["metadata"]["priority"];
    }
    return metadata;
  })(),
  sections: normalizeReportSections(row.sections as any[] | null | undefined),
  checklist: (row.checklist as Report["checklist"] | null) ?? [],
  assets: (row.assets as Report["assets"] | null) ?? [],
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  exportedAt: row.exported_at ?? null,
  publicId: row.public_id ?? null,
  customerEmail: row.customer_email ?? null,
  customerApprovedAt: row.customer_approved_at ?? null,
  customerApprovedBy: row.customer_approved_by ?? null,
  pdfTemplateId: row.pdf_template_id ?? null,
  coverImageUrl: row.cover_image_url ?? null,
  coverSubtitle: row.cover_subtitle ?? null,
  userId: row.user_id ?? null,
  organizationId: row.organization_id ?? null,
  version: row.version ?? undefined,
});

const mapReportSectionRow = (
  row: ReportSectionRow,
): ReportSectionDefinition => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  category: row.category ?? undefined,
  type: (row.type as ReportSectionType) ?? "text",
  imageUrl: row.image_url ?? undefined,
  imageAltText: row.image_alt_text ?? undefined,
  isDefaultSection: row.is_default_section ?? false,
});

const getCurrentUserId = async (
  supabase: ReturnType<typeof createSupabaseClient>,
) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
};

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const fetchReportTemplates = async (): Promise<ReportTemplate[]> => {
  if (IS_DEMO_MODE) return mockReportTemplates;

  try {
    const supabase = createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("No authenticated user");
      return mockReportTemplates;
    }

    // RLS handles org-level filtering
    const { data, error } = await supabase
      .from("report_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];
    return data.map(mapReportTemplateRow);
  } catch (err) {
    console.error("Failed to fetch report templates", err);
    return mockReportTemplates;
  }
};

export const fetchReportSections = async (): Promise<
  ReportSectionDefinition[]
> => {
  if (IS_DEMO_MODE) return mockReportSections;

  try {
    const supabase = createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("No authenticated user");
      return mockReportSections;
    }

    // RLS handles org-level filtering
    const { data, error } = await supabase
      .from("report_sections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as ReportSectionRow[] | null)?.map(mapReportSectionRow) ?? [];
  } catch (err) {
    console.error("Failed to fetch report sections", err);
    return mockReportSections;
  }
};

export const fetchReports = async (): Promise<Report[]> => {
  if (IS_DEMO_MODE) return mockReports;

  try {
    const supabase = createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("No authenticated user");
      return mockReports;
    }

    // RLS handles org-level filtering
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];
    return data.map(mapReportRow);
  } catch (err) {
    console.error("Failed to fetch reports", err);
    return mockReports;
  }
};

export const createReportSectionRecord = async (
  input: Omit<ReportSectionDefinition, "id">,
): Promise<ReportSectionDefinition> => {
  if (IS_DEMO_MODE) {
    const section: ReportSectionDefinition = { id: randomId(), ...input };
    useReportSectionsStore.getState().addSection(section);
    return section;
  }

  const supabase = createSupabaseClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    const section: ReportSectionDefinition = { id: randomId(), ...input };
    useReportSectionsStore.getState().addSection(section);
    return section;
  }

  // Get organization_id for RLS compliance
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  const organizationId = profile?.organization_id;

  const { data, error } = await supabase
    .from("report_sections")
    .insert({
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? null,
      type: input.type ?? "text",
      image_url: input.imageUrl ?? null,
      image_alt_text: input.imageAltText ?? null,
      is_default_section: input.isDefaultSection ?? false,
      questions: [],
      user_id: userId,
      organization_id: organizationId,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create report section", error);
    const section: ReportSectionDefinition = { id: randomId(), ...input };
    useReportSectionsStore.getState().addSection(section);
    return section;
  }

  const mapped = mapReportSectionRow(data as ReportSectionRow);
  useReportSectionsStore.getState().addSection(mapped);
  return mapped;
};

export const updateReportSectionRecord = async (
  section: ReportSectionDefinition,
): Promise<ReportSectionDefinition> => {
  if (IS_DEMO_MODE) {
    useReportSectionsStore.getState().updateSection(section.id, section);
    return section;
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("report_sections")
    .update({
      title: section.title,
      description: section.description ?? null,
      category: section.category ?? null,
      type: section.type ?? "text",
      image_url: section.imageUrl ?? null,
      image_alt_text: section.imageAltText ?? null,
      is_default_section: section.isDefaultSection ?? false,
      questions: [],
    })
    .eq("id", section.id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update report section", error);
    useReportSectionsStore.getState().updateSection(section.id, section);
    return section;
  }

  const mapped = mapReportSectionRow(data as ReportSectionRow);
  useReportSectionsStore.getState().updateSection(section.id, mapped);
  return mapped;
};

export const deleteReportSectionRecord = async (id: string) => {
  if (IS_DEMO_MODE) {
    useReportSectionsStore.getState().removeSection(id);
    return;
  }

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("report_sections")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete report section", error);
  }

  useReportSectionsStore.getState().removeSection(id);
};

export const createReportTemplateRecord = async (
  input: Pick<ReportTemplate, "name" | "trade" | "description" | "designId"> & {
    sections?: ReportTemplate["sections"];
    checklist?: ReportTemplate["checklist"];
  },
): Promise<ReportTemplate> => {
  const sections = input.sections ?? [];
  const checklist = input.checklist ?? [];

  if (IS_DEMO_MODE) {
    const template: ReportTemplate = {
      id: randomId(),
      name: input.name,
      trade: input.trade,
      description: input.description,
      designId: input.designId,
      sections,
      checklist,
      assetGuidelines: [],
      visibilityRules: [],
    };
    useReportTemplatesStore.getState().upsertTemplate(template);
    return template;
  }

  const supabase = createSupabaseClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    const template: ReportTemplate = {
      id: randomId(),
      name: input.name,
      trade: input.trade,
      description: input.description,
      designId: input.designId,
      sections,
      checklist,
      assetGuidelines: [],
      visibilityRules: [],
    };
    useReportTemplatesStore.getState().upsertTemplate(template);
    return template;
  }

  // Get organization_id for RLS compliance
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  const organizationId = profile?.organization_id;

  const { data, error } = await supabase
    .from("report_templates")
    .insert({
      name: input.name,
      trade: input.trade,
      description: input.description ?? null,
      sections: sections,
      checklist: checklist,
      asset_guidelines: [],
      visibility_rules: [],
      design_id: input.designId ?? null,
      user_id: userId,
      organization_id: organizationId,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create template", error);
    const template: ReportTemplate = {
      id: randomId(),
      name: input.name,
      trade: input.trade,
      description: input.description,
      designId: input.designId,
      sections,
      checklist,
      assetGuidelines: [],
      visibilityRules: [],
    };
    useReportTemplatesStore.getState().upsertTemplate(template);
    return template;
  }

  const mapped = mapReportTemplateRow(data as ReportTemplateRow);
  useReportTemplatesStore.getState().upsertTemplate(mapped);
  return mapped;
};

export const updateReportTemplateRecord = async (
  id: string,
  updates: Partial<ReportTemplate>,
): Promise<ReportTemplate | null> => {
  if (IS_DEMO_MODE) {
    const template = useReportTemplatesStore
      .getState()
      .templates.find((tpl) => tpl.id === id);
    if (!template) return null;
    const merged = { ...template, ...updates };
    useReportTemplatesStore.getState().upsertTemplate(merged);
    return merged;
  }

  const supabase = createSupabaseClient();
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.trade !== undefined) payload.trade = updates.trade;
  if (updates.description !== undefined)
    payload.description = updates.description ?? null;
  if (updates.sections !== undefined) payload.sections = updates.sections;
  if (updates.checklist !== undefined) payload.checklist = updates.checklist;
  if (updates.assetGuidelines !== undefined)
    payload.asset_guidelines = updates.assetGuidelines;
  if (updates.visibilityRules !== undefined)
    payload.visibility_rules = updates.visibilityRules;
  if (updates.designId !== undefined) payload.design_id = updates.designId;

  const { data, error } = await supabase
    .from("report_templates")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update template", error);
    return null;
  }

  const mapped = mapReportTemplateRow(data as ReportTemplateRow);
  useReportTemplatesStore.getState().upsertTemplate(mapped);
  return mapped;
};

export const createReport = async (
  input: CreateReportInput,
): Promise<Report> => {
  const nowIso = new Date().toISOString();
  const scheduledAt = input.metadata.scheduledAt ?? nowIso;
  const dueAt = input.metadata.dueAt ?? scheduledAt;
  const priority =
    input.priority ??
    input.metadata.priority ??
    DEFAULT_REPORT_METADATA.priority;

  // Hämta mallens designId om en templateId finns
  let designId: string | undefined;
  if (input.templateId) {
    const template = useReportTemplatesStore
      .getState()
      .templates.find((t) => t.id === input.templateId);
    designId = template?.designId;
  }

  const metadata: Report["metadata"] = {
    ...DEFAULT_REPORT_METADATA,
    ...input.metadata,
    scheduledAt,
    dueAt,
    priority,
    designId: designId as any, // Lägg till designId från mallen
  };

  const baseReport: Report = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    title: input.title,
    status: input.status ?? "draft",
    type: input.trade,
    templateId: input.templateId,
    metadata,
    sections: normalizeReportSections(input.sections ?? []),
    checklist: input.checklist ?? [],
    assets: input.assets ?? [],
    updatedAt: nowIso,
  };

  if (IS_DEMO_MODE) {
    useReportsStore.getState().upsertReport(baseReport);
    return baseReport;
  }

  const supabase = createSupabaseClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    useReportsStore.getState().upsertReport(baseReport);
    return baseReport;
  }

  // Get organization_id for RLS compliance
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  const organizationId = profile?.organization_id;

  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: userId,
      organization_id: organizationId,
      title: baseReport.title,
      template_id: baseReport.templateId,
      trade: baseReport.type,
      status: baseReport.status,
      priority,
      metadata,
      sections: baseReport.sections,
      checklist: baseReport.checklist,
      assets: baseReport.assets,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error(
      "Supabase insert for report failed, falling back to local state",
      error,
    );
    useReportsStore.getState().upsertReport(baseReport);
    return baseReport;
  }

  const mapped = mapReportRow(data as ReportRow);
  useReportsStore.getState().upsertReport(mapped);
  return mapped;
};

export const updateReport = async (
  id: string,
  updates: Partial<Report>,
): Promise<Report> => {
  const nowIso = new Date().toISOString();
  const updatedReport: Report = {
    ...updates,
    id,
    updatedAt: nowIso,
  } as Report;

  if (IS_DEMO_MODE) {
    useReportsStore.getState().upsertReport(updatedReport);
    return updatedReport;
  }

  const supabase = createSupabaseClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    useReportsStore.getState().upsertReport(updatedReport);
    return updatedReport;
  }

  // Bygg update payload dynamiskt för att undvika att skriva över med undefined
  const updatePayload: Record<string, any> = {
    updated_at: nowIso,
  };

  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.metadata !== undefined) {
    updatePayload.metadata = updates.metadata;
    if (updates.metadata.priority)
      updatePayload.priority = updates.metadata.priority;
  }
  if (updates.sections !== undefined) updatePayload.sections = updates.sections;
  if (updates.checklist !== undefined)
    updatePayload.checklist = updates.checklist;
  if (updates.assets !== undefined) updatePayload.assets = updates.assets;
  if (updates.exportedAt !== undefined)
    updatePayload.exported_at = updates.exportedAt;
  if (updates.publicId !== undefined)
    updatePayload.public_id = updates.publicId;
  if (updates.customerEmail !== undefined)
    updatePayload.customer_email = updates.customerEmail;
  if (updates.customerApprovedAt !== undefined)
    updatePayload.customer_approved_at = updates.customerApprovedAt;
  if (updates.customerApprovedBy !== undefined)
    updatePayload.customer_approved_by = updates.customerApprovedBy;
  if (updates.pdfTemplateId !== undefined)
    updatePayload.pdf_template_id = updates.pdfTemplateId;
  if (updates.coverImageUrl !== undefined)
    updatePayload.cover_image_url = updates.coverImageUrl;
  if (updates.coverSubtitle !== undefined)
    updatePayload.cover_subtitle = updates.coverSubtitle;

  const { data, error } = await supabase
    .from("reports")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error(
      "Supabase update for report failed, falling back to local state",
      error,
    );
    useReportsStore.getState().upsertReport(updatedReport);
    return updatedReport;
  }

  const mapped = mapReportRow(data as ReportRow);
  useReportsStore.getState().upsertReport(mapped);
  return mapped;
};

export const deleteReport = async (id: string): Promise<void> => {
  if (IS_DEMO_MODE) {
    const currentReports = useReportsStore.getState().reports;
    useReportsStore
      .getState()
      .setReports(currentReports.filter((r) => r.id !== id));
    return;
  }

  const supabase = createSupabaseClient();
  const { error } = await supabase.from("reports").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete report", error);
    throw error;
  }

  const currentReports = useReportsStore.getState().reports;
  useReportsStore
    .getState()
    .setReports(currentReports.filter((r) => r.id !== id));
};

/**
 * Genererar en unik public ID för rapport-delning
 */
const generatePublicId = (): string => {
  return `pub_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Exporterar en rapport som PDF och arkiverar den.
 * Denna funktion hanterar hela exportflödet:
 * 1. Sparar senaste ändringar
 * 2. Genererar public_id för delning
 * 3. Markerar rapporten som exporterad och godkänd
 * 4. Returnerar den uppdaterade rapporten
 */
export const exportReportAsPdf = async (
  report: Report,
  customerEmail?: string,
): Promise<Report> => {
  const nowIso = new Date().toISOString();
  const publicId = report.publicId || generatePublicId();

  // Uppdatera rapport med exportdatum, public_id och godkänd status
  const updatedReport = await updateReport(report.id, {
    ...report,
    exportedAt: nowIso,
    status: "approved",
    publicId,
    customerEmail: customerEmail || report.customerEmail,
  });

  return updatedReport;
};

export const fetchEvents = async () => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_time");

  if (error) throw error;
  return data as EventRow[];
};

export const fetchTasks = async () => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("due_date");

  if (error) throw error;
  return data as TaskRow[];
};

export const createEvent = async (input: {
  title: string;
  start_time: string;
  end_time: string;
  status?: "busy" | "available";
  description?: string | null;
  contact_id?: string | null;
  property_id?: string | null;
  event_type?: "showing" | "meeting" | "call" | "open-house" | "other" | null;
}) => {
  try {
    if (IS_DEMO_MODE) {
      const id =
        typeof crypto !== "undefined" && (crypto as any).randomUUID
          ? (crypto as any).randomUUID()
          : Math.random().toString(36).slice(2);
      const nowIso = new Date().toISOString();
      const demoEvent: EventRow = {
        id,
        title: input.title,
        start_time: input.start_time,
        end_time: input.end_time,
        status: input.status ?? "busy",
        description: input.description ?? null,
        contact_id: input.contact_id ?? null,
        property_id: input.property_id ?? null,
        event_type: input.event_type ?? "other",
        organization_id: "demo-org",
        created_at: nowIso,
        updated_at: nowIso,
        user_id: "demo-user",
      } as EventRow;
      return demoEvent;
    }

    const supabase = createSupabaseClient();

    // Get user and their organization_id for RLS compliance
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No authenticated user");
    }

    const { data: profile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    const organizationId = profile?.organization_id;

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: input.title,
        start_time: input.start_time,
        end_time: input.end_time,
        status: input.status ?? "busy",
        description: input.description ?? null,
        contact_id: input.contact_id ?? null,
        property_id: input.property_id ?? null,
        event_type: input.event_type ?? "other",
        user_id: user.id,
        organization_id: organizationId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as EventRow;
  } catch (_error) {
    console.error("Failed to create event:", _error);
    const id = Math.random().toString(36).slice(2);
    const nowIso = new Date().toISOString();
    const fallback: EventRow = {
      id,
      title: input.title,
      start_time: input.start_time,
      end_time: input.end_time,
      status: input.status ?? "busy",
      description: input.description ?? null,
      contact_id: input.contact_id ?? null,
      property_id: input.property_id ?? null,
      event_type: input.event_type ?? "other",
      organization_id: "demo-org",
      created_at: nowIso,
      updated_at: nowIso,
      user_id: "demo-user",
    } as EventRow;
    return fallback;
  }
};

export const deleteEventById = async (id: string) => {
  if (IS_DEMO_MODE) {
    useEventsStore.getState().deleteEvent(id);
    return;
  }

  const supabase = createSupabaseClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  useEventsStore.getState().deleteEvent(id);
};

// Persist updates for an existing event and sync local store
export const updateEventById = async (
  id: string,
  updates: Partial<
    Pick<
      EventRow,
      | "title"
      | "start_time"
      | "end_time"
      | "status"
      | "description"
      | "contact_id"
      | "property_id"
      | "event_type"
    >
  >,
) => {
  if (IS_DEMO_MODE) {
    useEventsStore.getState().updateEvent(id, updates as Partial<EventRow>);
    return useEventsStore.getState().events.find((e) => e.id === id) ?? null;
  }

  const supabase = createSupabaseClient();
  const payload: Record<string, any> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.start_time !== undefined) payload.start_time = updates.start_time;
  if (updates.end_time !== undefined) payload.end_time = updates.end_time;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.description !== undefined)
    payload.description = updates.description;
  if (updates.contact_id !== undefined) payload.contact_id = updates.contact_id;
  if (updates.property_id !== undefined)
    payload.property_id = updates.property_id;
  if (updates.event_type !== undefined) payload.event_type = updates.event_type;

  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  const updated = data as EventRow;
  useEventsStore.getState().updateEvent(id, updated);
  return updated;
};
