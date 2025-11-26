"use client";

import { Search } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { useEventsStore } from "@/lib/store";

export function CalendarSidebar() {
  const { selectedDate, setSelectedDate } = useEventsStore();

  return (
    <div className="flex flex-col h-full gap-6 p-4 bg-card w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Kalender</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök händelse..."
          className="pl-9 bg-muted/50 border-none shadow-none"
        />
      </div>

      <div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-md border shadow-sm bg-background p-0"
          classNames={{
            head_cell: "text-muted-foreground font-normal text-[0.8rem]",
            cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
        />
      </div>

    </div>
  );
}
