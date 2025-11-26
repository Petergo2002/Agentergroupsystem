export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: string | null;
          organization_id: string | null;
          created_at: string;
          updated_at: string;
          is_super_admin: boolean | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role?: string | null;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
          is_super_admin?: boolean | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: string | null;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
          is_super_admin?: boolean | null;
        };
      };
      customers: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          notes: string | null;
          channel: string | null;
          customer_type: string | null;
          lifecycle_stage: string | null;
          service_area: string | null;
          preferred_contact_method: string | null;
          tags: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          notes?: string | null;
          channel?: string | null;
          customer_type?: string | null;
          lifecycle_stage?: string | null;
          service_area?: string | null;
          preferred_contact_method?: string | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
      };
      leads: {
        Row: {
          id: string;
          organization_id: string | null;
          customer_id: string | null;
          user_id: string | null;
          job_type: string | null;
          description: string | null;
          address: string | null;
          budget: number | null;
          source: string | null;
          is_qualified: boolean | null;
          status:
            | "new"
            | "qualified"
            | "quoted"
            | "booked"
            | "completed"
            | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          customer_id?: string | null;
          user_id?: string | null;
          job_type?: string | null;
          description?: string | null;
          address?: string | null;
          budget?: number | null;
          source?: string | null;
          is_qualified?: boolean | null;
          status?:
            | "new"
            | "qualified"
            | "quoted"
            | "booked"
            | "completed"
            | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
      };
      jobs: {
        Row: {
          id: string;
          organization_id: string | null;
          user_id: string | null;
          lead_id: string | null;
          assigned_to: string | null;
          start_time: string | null;
          end_time: string | null;
          status: "scheduled" | "in_progress" | "done";
          notes: string | null;
          materials: Json | null;
          cost_estimate: number | null;
          price_estimate: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          lead_id?: string | null;
          assigned_to?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          status?: "scheduled" | "in_progress" | "done";
          notes?: string | null;
          materials?: Json | null;
          cost_estimate?: number | null;
          price_estimate?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Row"]>;
      };
      quotes: {
        Row: {
          id: string;
          organization_id: string | null;
          user_id: string | null;
          lead_id: string | null;
          total: number | null;
          status: "sent" | "accepted" | "rejected";
          sent_at: string | null;
          accepted_at: string | null;
          valid_until: string | null;
          line_items: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          lead_id?: string | null;
          total?: number | null;
          status?: "sent" | "accepted" | "rejected";
          sent_at?: string | null;
          accepted_at?: string | null;
          valid_until?: string | null;
          line_items?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["quotes"]["Row"]>;
      };
      invoices: {
        Row: {
          id: string;
          organization_id: string | null;
          user_id: string | null;
          lead_id: string | null;
          amount: number;
          due_date: string | null;
          status: "unpaid" | "paid" | "overdue";
          created_at: string | null;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          lead_id?: string | null;
          amount: number;
          due_date?: string | null;
          status?: "unpaid" | "paid" | "overdue";
          created_at?: string | null;
          paid_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
      };
      events: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          customer_id: string | null;
          job_id: string | null;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          status: "available" | "busy";
          event_type:
            | "site_visit"
            | "install"
            | "service"
            | "inspection"
            | "meeting"
            | "other";
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          customer_id?: string | null;
          job_id?: string | null;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          status?: "available" | "busy";
          event_type?:
            | "site_visit"
            | "install"
            | "service"
            | "inspection"
            | "meeting"
            | "other";
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
      };
      tasks: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          title: string;
          due_date: string | null;
          status: "todo" | "in-progress" | "done";
          customer_id: string | null;
          job_id: string | null;
          event_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          title: string;
          due_date?: string | null;
          status?: "todo" | "in-progress" | "done";
          customer_id?: string | null;
          job_id?: string | null;
          event_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
      };
      chat_widget_configs: {
        Row: {
          id: string;
          org_id: string;
          public_id: string;
          logo_url: string | null;
          primary_color: string | null;
          welcome_message: string | null;
          vapi_agent_id: string | null;
          vapi_agent_uuid: string | null;
          enabled: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          public_id?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          welcome_message?: string | null;
          vapi_agent_id?: string | null;
          vapi_agent_uuid?: string | null;
          enabled?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["chat_widget_configs"]["Row"]
        >;
      };
      pdf_designs: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          blocks: Json;
          branding: Json | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          blocks?: Json;
          branding?: Json | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pdf_designs"]["Row"]>;
      };
      report_templates: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          name: string;
          trade: "bygg" | "läckage" | "elektriker";
          description: string | null;
          sections: Json | null;
          checklist: Json | null;
          asset_guidelines: Json | null;
          visibility_rules: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          name: string;
          trade: "bygg" | "läckage" | "elektriker";
          description?: string | null;
          sections?: Json | null;
          checklist?: Json | null;
          asset_guidelines?: Json | null;
          visibility_rules?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["report_templates"]["Row"]
        >;
      };
      reports: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          template_id: string | null;
          title: string;
          trade: "bygg" | "läckage" | "elektriker";
          status: "draft" | "review" | "approved";
          priority: "low" | "medium" | "high";
          metadata: Json | null;
          sections: Json | null;
          checklist: Json | null;
          assets: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          template_id?: string | null;
          title: string;
          trade: "bygg" | "läckage" | "elektriker";
          status?: "draft" | "review" | "approved";
          priority?: "low" | "medium" | "high";
          metadata?: Json | null;
          sections?: Json | null;
          checklist?: Json | null;
          assets?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Row"]>;
      };
      report_sections: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          title: string;
          description: string | null;
          category: string | null;
          type: "text" | "image" | "chart";
          image_url: string | null;
          image_alt_text: string | null;
          is_default_section: boolean;
          questions: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          title: string;
          description?: string | null;
          category?: string | null;
          type?: "text" | "image" | "chart";
          image_url?: string | null;
          image_alt_text?: string | null;
          is_default_section?: boolean;
          questions?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["report_sections"]["Row"]>;
      };
      api_keys: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      organizations: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      organization_members: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      feature_flags: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      usage_metrics: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
