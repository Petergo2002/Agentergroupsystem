/**
 * Database types generated from Supabase schema (Agenter dashboard project)
 * Project ID: yroeeqykhwlviuganwti
 * Last updated: 2025-11-28
 *
 * This file is the single source of truth for all database types.
 * Regenerate via Supabase MCP or CLI when schema changes.
 */

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
      // ============================================
      // AUTH & ORGANIZATION TABLES
      // ============================================
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: string | null;
          organization_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          vapi_api_key: string | null;
          is_super_admin: boolean | null;
          is_first_login: boolean | null;
        };
        Insert: {
          id: string; // Required - links to auth.users.id
          name: string;
          email: string;
          role?: string | null;
          organization_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          vapi_api_key?: string | null;
          is_super_admin?: boolean | null;
          is_first_login?: boolean | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: string | null;
          organization_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          vapi_api_key?: string | null;
          is_super_admin?: boolean | null;
          is_first_login?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          owner_id: string | null;
          logo_url: string | null;
          vapi_api_key: string | null;
          vapi_assistant_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          owner_id?: string | null;
          logo_url?: string | null;
          vapi_api_key?: string | null;
          vapi_assistant_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          owner_id?: string | null;
          logo_url?: string | null;
          vapi_api_key?: string | null;
          vapi_assistant_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          invited_by: string | null;
          joined_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_invited_by_fkey";
            columns: ["invited_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_settings: {
        Row: {
          id: string;
          pdf_profile: Json | null;
          enabled_pdf_designs: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          pdf_profile?: Json | null;
          enabled_pdf_designs?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          pdf_profile?: Json | null;
          enabled_pdf_designs?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          id: string;
          organization_id: string | null;
          flag_name: string;
          enabled: boolean;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          flag_name: string;
          enabled?: boolean;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          flag_name?: string;
          enabled?: boolean;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "feature_flags_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_log_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };

      // ============================================
      // CRM TABLES
      // ============================================
      contacts: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          is_lead: boolean | null;
          lead_quality: number | null;
          lead_source: string | null;
          budget_min: number | null;
          budget_max: number | null;
          property_type: string | null;
          bedrooms_min: number | null;
          bathrooms_min: number | null;
          location_preference: string | null;
          timeline: string | null;
          financing_status: string | null;
          current_home_owner: boolean | null;
          motivation_score: number | null;
          preferred_contact_method: string | null;
          channel: "phone" | "email" | "sms" | "web" | "referral" | null;
          customer_type:
            | "residential"
            | "commercial"
            | "public-sector"
            | null;
          lifecycle_stage:
            | "prospect"
            | "active"
            | "repeat"
            | "inactive"
            | null;
          service_area: string | null;
          tags: string[] | null;
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
          created_at?: string | null;
          updated_at?: string | null;
          is_lead?: boolean | null;
          lead_quality?: number | null;
          lead_source?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          property_type?: string | null;
          bedrooms_min?: number | null;
          bathrooms_min?: number | null;
          location_preference?: string | null;
          timeline?: string | null;
          financing_status?: string | null;
          current_home_owner?: boolean | null;
          motivation_score?: number | null;
          preferred_contact_method?: string | null;
          channel?: "phone" | "email" | "sms" | "web" | "referral" | null;
          customer_type?:
            | "residential"
            | "commercial"
            | "public-sector"
            | null;
          lifecycle_stage?:
            | "prospect"
            | "active"
            | "repeat"
            | "inactive"
            | null;
          service_area?: string | null;
          tags?: string[] | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_lead?: boolean | null;
          lead_quality?: number | null;
          lead_source?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          property_type?: string | null;
          bedrooms_min?: number | null;
          bathrooms_min?: number | null;
          location_preference?: string | null;
          timeline?: string | null;
          financing_status?: string | null;
          current_home_owner?: boolean | null;
          motivation_score?: number | null;
          preferred_contact_method?: string | null;
          channel?: "phone" | "email" | "sms" | "web" | "referral" | null;
          customer_type?:
            | "residential"
            | "commercial"
            | "public-sector"
            | null;
          lifecycle_stage?:
            | "prospect"
            | "active"
            | "repeat"
            | "inactive"
            | null;
          service_area?: string | null;
          tags?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      deals: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          contact_id: string | null;
          property_id: string | null;
          title: string;
          value: number | null;
          stage:
            | "lead"
            | "qualified"
            | "proposal"
            | "negotiation"
            | "closed_won"
            | "closed_lost";
          probability: number | null;
          expected_close_date: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          contact_id?: string | null;
          property_id?: string | null;
          title: string;
          value?: number | null;
          stage?:
            | "lead"
            | "qualified"
            | "proposal"
            | "negotiation"
            | "closed_won"
            | "closed_lost";
          probability?: number | null;
          expected_close_date?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          contact_id?: string | null;
          property_id?: string | null;
          title?: string;
          value?: number | null;
          stage?:
            | "lead"
            | "qualified"
            | "proposal"
            | "negotiation"
            | "closed_won"
            | "closed_lost";
          probability?: number | null;
          expected_close_date?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deals_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_property_id_fkey";
            columns: ["property_id"];
            referencedRelation: "properties";
            referencedColumns: ["id"];
          }
        ];
      };
      properties: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          address: string;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          country: string | null;
          property_type: string | null;
          bedrooms: number | null;
          bathrooms: number | null;
          square_feet: number | null;
          lot_size: number | null;
          year_built: number | null;
          price: number | null;
          status: "available" | "pending" | "sold" | "off_market" | null;
          description: string | null;
          features: Json | null;
          images: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          address: string;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string | null;
          property_type?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          square_feet?: number | null;
          lot_size?: number | null;
          year_built?: number | null;
          price?: number | null;
          status?: "available" | "pending" | "sold" | "off_market" | null;
          description?: string | null;
          features?: Json | null;
          images?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          address?: string;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string | null;
          property_type?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          square_feet?: number | null;
          lot_size?: number | null;
          year_built?: number | null;
          price?: number | null;
          status?: "available" | "pending" | "sold" | "off_market" | null;
          description?: string | null;
          features?: Json | null;
          images?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "properties_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "properties_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      events: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          contact_id: string | null;
          property_id: string | null;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          status: "available" | "busy" | null;
          event_type: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          contact_id?: string | null;
          property_id?: string | null;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          status?: "available" | "busy" | null;
          event_type?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          contact_id?: string | null;
          property_id?: string | null;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          status?: "available" | "busy" | null;
          event_type?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_property_id_fkey";
            columns: ["property_id"];
            referencedRelation: "properties";
            referencedColumns: ["id"];
          }
        ];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          contact_id: string | null;
          deal_id: string | null;
          event_id: string | null;
          title: string;
          description: string | null;
          due_date: string | null;
          status: "todo" | "in_progress" | "done" | null;
          priority: "low" | "medium" | "high" | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          contact_id?: string | null;
          deal_id?: string | null;
          event_id?: string | null;
          title: string;
          description?: string | null;
          due_date?: string | null;
          status?: "todo" | "in_progress" | "done" | null;
          priority?: "low" | "medium" | "high" | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          contact_id?: string | null;
          deal_id?: string | null;
          event_id?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          status?: "todo" | "in_progress" | "done" | null;
          priority?: "low" | "medium" | "high" | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_deal_id_fkey";
            columns: ["deal_id"];
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };

      // ============================================
      // REPORT SYSTEM TABLES
      // ============================================
      reports: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          template_id: string | null;
          template_id_uuid: string | null;
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
          exported_at: string | null;
          public_id: string | null;
          customer_email: string | null;
          customer_approved_at: string | null;
          customer_approved_by: string | null;
          pdf_template_id: string | null;
          cover_image_url: string | null;
          cover_subtitle: string | null;
          version: number;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          template_id?: string | null;
          template_id_uuid?: string | null;
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
          exported_at?: string | null;
          public_id?: string | null;
          customer_email?: string | null;
          customer_approved_at?: string | null;
          customer_approved_by?: string | null;
          pdf_template_id?: string | null;
          cover_image_url?: string | null;
          cover_subtitle?: string | null;
          version?: number;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          template_id?: string | null;
          template_id_uuid?: string | null;
          title?: string;
          trade?: "bygg" | "läckage" | "elektriker";
          status?: "draft" | "review" | "approved";
          priority?: "low" | "medium" | "high";
          metadata?: Json | null;
          sections?: Json | null;
          checklist?: Json | null;
          assets?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          exported_at?: string | null;
          public_id?: string | null;
          customer_email?: string | null;
          customer_approved_at?: string | null;
          customer_approved_by?: string | null;
          pdf_template_id?: string | null;
          cover_image_url?: string | null;
          cover_subtitle?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_template_id_uuid_fkey";
            columns: ["template_id_uuid"];
            referencedRelation: "report_templates";
            referencedColumns: ["id"];
          }
        ];
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
          design_id: string | null;
          version: number;
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
          design_id?: string | null;
          version?: number;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          name?: string;
          trade?: "bygg" | "läckage" | "elektriker";
          description?: string | null;
          sections?: Json | null;
          checklist?: Json | null;
          asset_guidelines?: Json | null;
          visibility_rules?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          design_id?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "report_templates_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_templates_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
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
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          title?: string;
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
        Relationships: [
          {
            foreignKeyName: "report_sections_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_sections_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
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
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          blocks?: Json;
          branding?: Json | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pdf_designs_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      // ============================================
      // AI & WIDGET TABLES
      // ============================================
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
          updated_at: string | null;
          widget_position: "bottom-left" | "bottom-right" | null;
          placeholder_text: string | null;
          button_text: string | null;
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
          updated_at?: string | null;
          widget_position?: "bottom-left" | "bottom-right" | null;
          placeholder_text?: string | null;
          button_text?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          public_id?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          welcome_message?: string | null;
          vapi_agent_id?: string | null;
          vapi_agent_uuid?: string | null;
          enabled?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          widget_position?: "bottom-left" | "bottom-right" | null;
          placeholder_text?: string | null;
          button_text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_widget_configs_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_chat_sessions: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          assistant_id: string | null;
          channel: string;
          session_source: string | null;
          external_session_id: string | null;
          status: "active" | "completed" | "error";
          started_at: string;
          ended_at: string | null;
          last_message_at: string | null;
          message_count: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          assistant_id?: string | null;
          channel?: string;
          session_source?: string | null;
          external_session_id?: string | null;
          status?: "active" | "completed" | "error";
          started_at?: string;
          ended_at?: string | null;
          last_message_at?: string | null;
          message_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          assistant_id?: string | null;
          channel?: string;
          session_source?: string | null;
          external_session_id?: string | null;
          status?: "active" | "completed" | "error";
          started_at?: string;
          ended_at?: string | null;
          last_message_at?: string | null;
          message_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_chat_sessions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_chat_messages: {
        Row: {
          id: string;
          session_id: string;
          organization_id: string;
          user_id: string | null;
          assistant_id: string | null;
          role: "user" | "assistant" | "system";
          content: string;
          tokens: number | null;
          metadata: Json;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          organization_id: string;
          user_id?: string | null;
          assistant_id?: string | null;
          role: "user" | "assistant" | "system";
          content: string;
          tokens?: number | null;
          metadata?: Json;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          organization_id?: string;
          user_id?: string | null;
          assistant_id?: string | null;
          role?: "user" | "assistant" | "system";
          content?: string;
          tokens?: number | null;
          metadata?: Json;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "ai_chat_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_chat_messages_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_chat_messages_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_call_sessions: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          assistant_id: string | null;
          channel: string;
          source: string | null;
          direction: "inbound" | "outbound" | null;
          status:
            | "queued"
            | "connecting"
            | "in_progress"
            | "completed"
            | "busy"
            | "no-answer"
            | "failed";
          provider_call_id: string | null;
          from_number: string | null;
          to_number: string | null;
          duration_seconds: number | null;
          cost: number | null;
          started_at: string;
          ended_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          assistant_id?: string | null;
          channel?: string;
          source?: string | null;
          direction?: "inbound" | "outbound" | null;
          status?:
            | "queued"
            | "connecting"
            | "in_progress"
            | "completed"
            | "busy"
            | "no-answer"
            | "failed";
          provider_call_id?: string | null;
          from_number?: string | null;
          to_number?: string | null;
          duration_seconds?: number | null;
          cost?: number | null;
          started_at?: string;
          ended_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          assistant_id?: string | null;
          channel?: string;
          source?: string | null;
          direction?: "inbound" | "outbound" | null;
          status?:
            | "queued"
            | "connecting"
            | "in_progress"
            | "completed"
            | "busy"
            | "no-answer"
            | "failed";
          provider_call_id?: string | null;
          from_number?: string | null;
          to_number?: string | null;
          duration_seconds?: number | null;
          cost?: number | null;
          started_at?: string;
          ended_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_call_sessions_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_call_sessions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_usage_daily_metrics: {
        Row: {
          organization_id: string;
          assistant_id: string;
          channel: "chat" | "call";
          metric_date: string;
          session_count: number;
          message_count: number;
          duration_seconds: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          assistant_id?: string;
          channel: "chat" | "call";
          metric_date: string;
          session_count?: number;
          message_count?: number;
          duration_seconds?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          assistant_id?: string;
          channel?: "chat" | "call";
          metric_date?: string;
          session_count?: number;
          message_count?: number;
          duration_seconds?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_daily_metrics_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      vapi_calls: {
        Row: {
          id: string;
          organization_id: string | null;
          user_id: string | null;
          call_id: string;
          assistant_id: string | null;
          phone_number_id: string | null;
          customer_number: string | null;
          type: "inbound" | "outbound" | null;
          status: string | null;
          started_at: string | null;
          ended_at: string | null;
          duration_seconds: number | null;
          cost: number | null;
          transcript: string | null;
          summary: string | null;
          recording_url: string | null;
          stereo_recording_url: string | null;
          analysis: Json | null;
          messages: Json | null;
          metadata: Json | null;
          ended_reason: string | null;
          lead_created_id: string | null;
          meeting_created_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          call_id: string;
          assistant_id?: string | null;
          phone_number_id?: string | null;
          customer_number?: string | null;
          type?: "inbound" | "outbound" | null;
          status?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          duration_seconds?: number | null;
          cost?: number | null;
          transcript?: string | null;
          summary?: string | null;
          recording_url?: string | null;
          stereo_recording_url?: string | null;
          analysis?: Json | null;
          messages?: Json | null;
          metadata?: Json | null;
          ended_reason?: string | null;
          lead_created_id?: string | null;
          meeting_created_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          call_id?: string;
          assistant_id?: string | null;
          phone_number_id?: string | null;
          customer_number?: string | null;
          type?: "inbound" | "outbound" | null;
          status?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          duration_seconds?: number | null;
          cost?: number | null;
          transcript?: string | null;
          summary?: string | null;
          recording_url?: string | null;
          stereo_recording_url?: string | null;
          analysis?: Json | null;
          messages?: Json | null;
          metadata?: Json | null;
          ended_reason?: string | null;
          lead_created_id?: string | null;
          meeting_created_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vapi_calls_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vapi_calls_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vapi_calls_lead_created_id_fkey";
            columns: ["lead_created_id"];
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vapi_calls_meeting_created_id_fkey";
            columns: ["meeting_created_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };

      // ============================================
      // LEGACY / COMPATIBILITY TABLES
      // (kept for backward compatibility with existing code)
      // ============================================
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
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          name?: string;
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
        Relationships: [];
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
        Update: {
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
        Relationships: [];
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
        Update: {
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
        Relationships: [];
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
        Update: {
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
        Relationships: [];
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
        Update: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          lead_id?: string | null;
          amount?: number;
          due_date?: string | null;
          status?: "unpaid" | "paid" | "overdue";
          created_at?: string | null;
          paid_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

// ============================================
// HELPER TYPES
// ============================================

/** Extract Row type for a table */
export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/** Extract Insert type for a table */
export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

/** Extract Update type for a table */
export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Commonly used row types
export type UserRow = TableRow<"users">;
export type OrganizationRow = TableRow<"organizations">;
export type OrganizationMemberRow = TableRow<"organization_members">;
export type ContactRow = TableRow<"contacts">;
export type DealRow = TableRow<"deals">;
export type PropertyRow = TableRow<"properties">;
export type EventRow = TableRow<"events">;
export type TaskRow = TableRow<"tasks">;
export type ReportRow = TableRow<"reports">;
export type ReportTemplateRow = TableRow<"report_templates">;
export type ReportSectionRow = TableRow<"report_sections">;
export type PdfDesignRow = TableRow<"pdf_designs">;
export type ChatWidgetConfigRow = TableRow<"chat_widget_configs">;
export type AiChatSessionRow = TableRow<"ai_chat_sessions">;
export type AiChatMessageRow = TableRow<"ai_chat_messages">;
export type AiCallSessionRow = TableRow<"ai_call_sessions">;
export type VapiCallRow = TableRow<"vapi_calls">;
