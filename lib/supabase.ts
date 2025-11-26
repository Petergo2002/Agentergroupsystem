import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Demo mode: return a mock client so the app can run without Supabase
    return createMockSupabaseClient();
  }

  // Browser/client-side Supabase client
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Flag used by the UI to enable demo-mode behaviors (e.g., bypassing auth redirects)
export const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// --- Demo/Mock client (no network) ---
function createMockSupabaseClient(): any {
  const now = () => new Date().toISOString();
  const uuid = () => cryptoRandomUUID();

  const makeRow = (table: string, payload: any) => {
    const base: any = { id: uuid(), created_at: now(), updated_at: now() };
    switch (table) {
      case "contacts":
      case "customers":
        return {
          name: "",
          email: null,
          phone: null,
          company: null,
          notes: null,
          channel: "phone",
          customer_type: "residential",
          lifecycle_stage: "prospect",
          service_area: null,
          preferred_contact_method: "phone",
          tags: null,
          user_id: "demo-user",
          ...base,
          ...payload,
        };
      case "leads":
        return {
          job_type: "",
          status: "new",
          is_qualified: false,
          user_id: "demo-user",
          ...base,
          ...payload,
        };
      case "jobs":
        return {
          status: "scheduled",
          user_id: "demo-user",
          ...base,
          ...payload,
        };
      case "quotes":
        return {
          status: "sent",
          total: 0,
          user_id: "demo-user",
          ...base,
          ...payload,
        };
      case "invoices":
        return {
          status: "unpaid",
          amount: 0,
          user_id: "demo-user",
          ...base,
          ...payload,
        };
      case "tasks":
        return {
          title: "",
          due_date: null,
          status: "todo",
          contact_id: null,
          event_id: null,
          user_id: "demo-user",
          ...base,
          ...payload,
        };
      case "events":
        return {
          title: "",
          description: null,
          start_time: now(),
          end_time: now(),
          status: "busy",
          contact_id: null,
          property_id: null,
          event_type: "other",
          user_id: "demo-user",
          ...base,
          ...payload,
        };
      default:
        return { ...base, ...payload };
    }
  };

  const builder = (table: string) => ({
    select: (_cols?: string) => ({
      order: (_col?: string) =>
        Promise.resolve({ data: [] as any[], error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
    }),
    insert: (payload: any) => ({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: makeRow(table, Array.isArray(payload) ? payload[0] : payload),
            error: null,
          }),
      }),
    }),
    update: (payload: any) => ({
      eq: (_col: string, _val: any) => ({
        select: () => ({
          single: () =>
            Promise.resolve({ data: makeRow(table, payload), error: null }),
        }),
      }),
    }),
    delete: () => ({
      eq: (_col: string, _val: any) =>
        Promise.resolve({ data: null, error: null }),
    }),
  });

  return {
    from: (table: string) => builder(table),
    auth: {
      signUp: async (_args: any) => ({
        data: { user: null, session: null },
        error: null,
      }),
      signInWithPassword: async (_args: any) => ({
        data: { user: null, session: null },
        error: null,
      }),
      signInWithOAuth: async (_args: any) => ({
        data: { url: null },
        error: null,
      }),
      updateUser: async (_args: any) => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (cb: (_event: any, session: any) => void) => {
        // Immediately invoke with null session in demo mode
        cb("INITIAL", { user: null, session: null });
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      exchangeCodeForSession: async (_code: string) => ({
        data: { session: null },
        error: null,
      }),
    },
  };
}

// crypto-random UUID for demo without depending on Node's crypto in all envs
function cryptoRandomUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as { randomUUID: () => string }).randomUUID();
  }
  // Fallback simple UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type { Database } from "./database.types";
