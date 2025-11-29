"use client";

import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomersStore, useTasksStore } from "@/lib/store";

interface TaskListProps {
  onAddTask: () => void;
  onEditTask: (taskId: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
  todo: "Att göra",
  "in-progress": "Pågår",
  done: "Klar",
};

const STATUS_BADGES: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700",
  "in-progress": "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
};

export function TaskList({ onAddTask, onEditTask }: TaskListProps) {
  const tasks = useTasksStore((state) => state.tasks);
  const contacts = useCustomersStore((state) => state.customers);

  const enriched = useMemo(() => {
    return tasks
      .slice()
      .sort(
        (a, b) =>
          new Date(a.created_at ?? 0).getTime() -
          new Date(b.created_at ?? 0).getTime(),
      )
      .map((task) => ({
        ...task,
        contact:
          contacts.find((contact) => contact.id === task.contact_id) || null,
      }));
  }, [tasks, contacts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Uppgifter</h2>
          <p className="text-sm text-muted-foreground">
            Följ upp offerter, servicebesök och återkopplingar
          </p>
        </div>
        <Button onClick={onAddTask}>Ny uppgift</Button>
      </div>

      {enriched.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Inga uppgifter ännu. Lägg till dina första uppgifter för att hålla
            koll på uppföljningar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {enriched.map((task) => (
            <Card
              key={task.id}
              className="border border-border/70 hover:border-primary/40"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base text-foreground">
                    {task.title}
                  </CardTitle>
                  {task.contact && (
                    <p className="text-xs text-muted-foreground">
                      {task.contact.name}
                    </p>
                  )}
                </div>
                <Badge
                  className={
                    task.status ? STATUS_BADGES[task.status] ?? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-700"
                  }
                >
                  {task.status ? STATUS_LABEL[task.status] ?? task.status : "Okänd status"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {task.due_date && (
                  <p>
                    Förfaller{" "}
                    {format(new Date(task.due_date), "PPP", { locale: sv })}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditTask(task.id)}
                >
                  Redigera
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
