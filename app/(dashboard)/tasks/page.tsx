"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import {
  fetchCustomers,
  fetchEvents,
  fetchTasks,
  useCustomersStore,
  useEventsStore,
  useTasksStore,
} from "@/lib/store";

export default function TasksPage() {
  const { setTasks, setLoading } = useTasksStore();
  const { setCustomers } = useCustomersStore();
  const { setEvents } = useEventsStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);

        // Load tasks, contacts, and events for the form dropdowns
        const [tasksData, customersData, eventsData] = await Promise.all([
          fetchTasks().catch((err) => {
            console.error("Error fetching tasks:", err);
            toast.error("Failed to load tasks");
            return [];
          }),
          fetchCustomers().catch((err) => {
            console.error("Error fetching customers:", err);
            toast.error("Failed to load customers");
            return [];
          }),
          fetchEvents().catch((err) => {
            console.error("Error fetching events:", err);
            toast.error("Failed to load events");
            return [];
          }),
        ]);

        // Only update state if we have data
        if (tasksData) setTasks(tasksData);
        if (customersData) setCustomers(customersData);
        if (eventsData) setEvents(eventsData);
      } catch (error) {
        console.error("Unexpected error in loadData:", error);
        toast.error("An unexpected error occurred while loading data");
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    loadData();
  }, [setTasks, setCustomers, setEvents, setLoading]);

  const handleAddTask = () => {
    setEditingTaskId(undefined);
    setIsFormOpen(true);
  };

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTaskId(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <TaskList onAddTask={handleAddTask} onEditTask={handleEditTask} />

      <TaskForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        taskId={editingTaskId}
      />
    </div>
  );
}
