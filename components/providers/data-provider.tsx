"use client";

import { useEffect } from "react";
import {
  fetchCustomers,
  fetchEvents,
  fetchInvoices,
  fetchJobs,
  fetchLeads,
  fetchQuotes,
  fetchTasks,
  useAuthStore,
  useCustomersStore,
  useEventsStore,
  useInvoicesStore,
  useJobsStore,
  useLeadsStore,
  useQuotesStore,
  useTasksStore,
} from "@/lib/store";

/**
 * DataProvider - Loads contractor CRM data when a user is authenticated.
 * Keeps dashboard state in sync across navigation without refetching on every page.
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const setCustomers = useCustomersStore((state) => state.setCustomers);
  const setLeads = useLeadsStore((state) => state.setLeads);
  const setJobs = useJobsStore((state) => state.setJobs);
  const setQuotes = useQuotesStore((state) => state.setQuotes);
  const setInvoices = useInvoicesStore((state) => state.setInvoices);
  const setEvents = useEventsStore((state) => state.setEvents);
  const setTasks = useTasksStore((state) => state.setTasks);

  useEffect(() => {
    if (!user) return;

    const loadAllData = async () => {
      try {
        const [customers, leads, jobs, quotes, invoices, events, tasks] =
          await Promise.all([
            fetchCustomers().catch(() => []),
            fetchLeads().catch(() => []),
            fetchJobs().catch(() => []),
            fetchQuotes().catch(() => []),
            fetchInvoices().catch(() => []),
            fetchEvents().catch(() => []),
            fetchTasks().catch(() => []),
          ]);

        setCustomers(customers);
        setLeads(leads);
        setJobs(jobs);
        setQuotes(quotes);
        setInvoices(invoices);
        setEvents(events);
        setTasks(tasks);

        console.info("✅ Contractor data loaded", {
          customers: customers.length,
          leads: leads.length,
          jobs: jobs.length,
          quotes: quotes.length,
          invoices: invoices.length,
          events: events.length,
          tasks: tasks.length,
        });
      } catch (error) {
        console.error("❌ Failed loading contractor data", error);
      }
    };

    loadAllData();
  }, [
    user,
    setCustomers,
    setLeads,
    setJobs,
    setQuotes,
    setInvoices,
    setEvents,
    setTasks,
  ]);

  return <>{children}</>;
}
