"use client";

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SectionCardsProps {
  todayEvents: number;
  totalContacts: number;
  pendingTasks: number;
  weekEvents: number;
  newContactsThisWeek?: number;
  completedTasksThisWeek?: number;
}

export function SectionCards({
  todayEvents,
  totalContacts,
  pendingTasks,
  weekEvents,
  newContactsThisWeek = 0,
  completedTasksThisWeek = 0,
}: SectionCardsProps) {
  const contactGrowth =
    totalContacts > 0
      ? ((newContactsThisWeek / totalContacts) * 100).toFixed(1)
      : "0";
  const taskCompletionRate =
    pendingTasks + completedTasksThisWeek > 0
      ? (
          (completedTasksThisWeek / (pendingTasks + completedTasksThisWeek)) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Dagens händelser</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {todayEvents}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Idag
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Schemalagda händelser
          </div>
          <div className="text-muted-foreground">
            {weekEvents} händelser denna vecka
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Totalt kontakter</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalContacts}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {newContactsThisWeek > 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {newContactsThisWeek > 0 ? `+${contactGrowth}%` : "0%"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {newContactsThisWeek > 0
              ? `+${newContactsThisWeek} nya denna vecka`
              : "Inga nya denna vecka"}
          </div>
          <div className="text-muted-foreground">Kontakter i din CRM</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Väntande uppgifter</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {pendingTasks}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {completedTasksThisWeek > 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {taskCompletionRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {completedTasksThisWeek} slutförda denna vecka
          </div>
          <div className="text-muted-foreground">Uppgifter att slutföra</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Denna vecka</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {weekEvents}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Kommande
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Planerade möten och bokningar
          </div>
          <div className="text-muted-foreground">Nästa 7 dagar</div>
        </CardFooter>
      </Card>
    </div>
  );
}
