"use client";

import { IconCalendar } from "@tabler/icons-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomersStore, useEventsStore, useTasksStore } from "@/lib/store";
import { createSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type TaskFormState = {
  title: string;
  due_date: Date | null;
  status: "todo" | "in-progress" | "done";
  contact_id: string | null;
  event_id: string | null;
};

const DEFAULT_STATE: TaskFormState = {
  title: "",
  due_date: null,
  status: "todo",
  contact_id: null,
  event_id: null,
};

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
}

export function TaskForm({ isOpen, onClose, taskId }: TaskFormProps) {
  const { tasks, addTask, updateTask, setLoading } = useTasksStore();
  const contacts = useCustomersStore((state) => state.customers);
  const events = useEventsStore((state) => state.events);
  const editing = Boolean(taskId);
  const existingTask = tasks.find((task) => task.id === taskId);
  const [formState, setFormState] = useState<TaskFormState>(DEFAULT_STATE);

  useEffect(() => {
    if (!isOpen) return;
    if (editing && existingTask) {
      setFormState({
        title: existingTask.title,
        due_date: existingTask.due_date
          ? new Date(existingTask.due_date)
          : null,
        status: existingTask.status as TaskFormState["status"],
        contact_id: existingTask.contact_id,
        event_id: existingTask.event_id,
      });
    } else {
      setFormState(DEFAULT_STATE);
    }
  }, [editing, existingTask, isOpen]);

  const handleChange = (
    field: keyof TaskFormState,
    value: string | Date | null,
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.title.trim()) {
      toast.error("Ange en titel");
      return;
    }

    try {
      setLoading(true);
      const supabase = createSupabaseClient();

      // Get user and organization_id for RLS compliance
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Du måste vara inloggad");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      const organizationId = profile?.organization_id;

      const payload = {
        title: formState.title.trim(),
        due_date: formState.due_date ? formState.due_date.toISOString() : null,
        status: formState.status,
        contact_id: formState.contact_id,
        event_id: formState.event_id,
      };

      if (editing && taskId) {
        const { data, error } = await supabase
          .from("tasks")
          .update(payload)
          .eq("id", taskId)
          .select()
          .single();
        if (error) throw error;
        updateTask(taskId, data);
        toast.success("Uppgift uppdaterad");
      } else {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            ...payload,
            user_id: user.id,
            organization_id: organizationId,
          })
          .select()
          .single();
        if (error) throw error;
        addTask(data);
        toast.success("Uppgift skapad");
      }

      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte spara uppgiften");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Redigera uppgift" : "Ny uppgift"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formState.title}
              onChange={(event) => handleChange("title", event.target.value)}
              placeholder="Ex. Ringa kund om service"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Förfallodatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formState.due_date && "text-muted-foreground",
                  )}
                >
                  <IconCalendar className="mr-2 h-4 w-4" />
                  {formState.due_date
                    ? format(formState.due_date, "PPP")
                    : "Välj datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formState.due_date ?? undefined}
                  onSelect={(date) => handleChange("due_date", date ?? null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formState.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Att göra</SelectItem>
                  <SelectItem value="in-progress">Pågående</SelectItem>
                  <SelectItem value="done">Klar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Koppla kund</Label>
              <Select
                value={formState.contact_id ?? "none"}
                onValueChange={(value) =>
                  handleChange("contact_id", value === "none" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kund (valfritt)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen kund</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Koppla kalenderhändelse</Label>
            <Select
              value={formState.event_id ?? "none"}
              onValueChange={(value) =>
                handleChange("event_id", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj händelse (valfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen händelse</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit">
              {editing ? "Spara uppgift" : "Skapa uppgift"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
