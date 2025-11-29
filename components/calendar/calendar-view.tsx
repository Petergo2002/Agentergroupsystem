"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { sv } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  PanelRight,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEventsStore } from "@/lib/store";
import { cn, SWEDEN_TZ } from "@/lib/utils";
import { EventPopoverForm } from "./event-popover-form";

interface CalendarViewProps {
  onEventClick?: (eventId: string) => void;
  onDateClick?: (date: Date) => void;
  onAddEvent?: (date: Date) => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const EVENT_COLORS = {
  showing: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-500",
    label: "Visning",
  },
  meeting: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-500",
    label: "Möte",
  },
  call: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-500",
    label: "Samtal",
  },
  "open-house": {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-500",
    label: "Öppet hus",
  },
  other: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-500",
    label: "Övrigt",
  },
} as const;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROW_HEIGHT = 60;

// Spacing constants for Google Calendar-like layout
const EVENT_VERTICAL_GAP = 2; // px gap between events
const EVENT_HORIZONTAL_GAP = 4; // px gap between side-by-side events
const EVENT_PADDING_LEFT = 4; // px padding from left edge of column
const EVENT_PADDING_RIGHT = 4; // px padding from right edge of column

// Helper function to calculate event layout for overlapping events
interface EventWithLayout {
  event: any;
  columnIndex: number;
  columnCount: number;
  startMinutes: number;
  endMinutes: number;
}

function getEventLayout(
  events: any[],
  fmtTz: (date: Date | string, fmt: string) => string,
): EventWithLayout[] {
  if (events.length === 0) return [];

  // Convert events to have start/end in minutes from midnight
  const eventsWithTime = events.map((event) => {
    const startH = parseInt(fmtTz(event.start_time, "H"), 10);
    const startM = parseInt(fmtTz(event.start_time, "m"), 10);
    const endH = parseInt(fmtTz(event.end_time, "H"), 10);
    const endM = parseInt(fmtTz(event.end_time, "m"), 10);
    return {
      event,
      startMinutes: startH * 60 + startM,
      endMinutes: endH * 60 + endM,
    };
  });

  // Sort by start time, then by duration (longer events first)
  eventsWithTime.sort((a, b) => {
    if (a.startMinutes !== b.startMinutes)
      return a.startMinutes - b.startMinutes;
    return b.endMinutes - b.startMinutes - (a.endMinutes - a.startMinutes);
  });

  // Assign columns using a greedy algorithm
  const result: EventWithLayout[] = [];
  const columns: { endMinutes: number }[] = [];

  for (const item of eventsWithTime) {
    // Find the first column where this event can fit (no overlap)
    let columnIndex = -1;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (col && col.endMinutes <= item.startMinutes) {
        columnIndex = i;
        break;
      }
    }

    if (columnIndex === -1) {
      // Need a new column
      columnIndex = columns.length;
      columns.push({ endMinutes: item.endMinutes });
    } else {
      const col = columns[columnIndex];
      if (col) col.endMinutes = item.endMinutes;
    }

    result.push({
      ...item,
      columnIndex,
      columnCount: 0, // Will be calculated in second pass
    });
  }

  // Second pass: determine column count for each event based on overlapping events
  for (let i = 0; i < result.length; i++) {
    const current = result[i];
    if (!current) continue;
    let maxColumn = current.columnIndex;

    // Find all events that overlap with this one
    for (let j = 0; j < result.length; j++) {
      const other = result[j];
      if (!other) continue;
      // Check if they overlap in time
      if (
        current.startMinutes < other.endMinutes &&
        current.endMinutes > other.startMinutes
      ) {
        maxColumn = Math.max(maxColumn, other.columnIndex);
      }
    }

    current.columnCount = maxColumn + 1;
  }

  return result;
}

export function CalendarView({
  onEventClick,
  onDateClick,
  onAddEvent,
  sidebarOpen = true,
  onToggleSidebar,
}: CalendarViewProps) {
  const { events, selectedDate, viewMode, setSelectedDate, setViewMode } =
    useEventsStore();
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [popoverOpenId, setPopoverOpenId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>(
    Object.keys(EVENT_COLORS),
  );

  const fmtTz = (date: Date | string, fmt: string) =>
    formatInTimeZone(new Date(date), SWEDEN_TZ, fmt, { locale: sv });

  // Filter events based on search and type filters
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        searchQuery === "" ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilters.includes(event.event_type || "other");
      return matchesSearch && matchesFilter;
    });
  }, [events, searchQuery, activeFilters]);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      setCurrentDate(
        direction === "prev"
          ? subMonths(currentDate, 1)
          : addMonths(currentDate, 1),
      );
    } else if (viewMode === "week") {
      setCurrentDate(
        direction === "prev"
          ? subWeeks(currentDate, 1)
          : addWeeks(currentDate, 1),
      );
    } else {
      setCurrentDate(
        direction === "prev"
          ? subDays(currentDate, 1)
          : addDays(currentDate, 1),
      );
    }
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(
      (event) =>
        fmtTz(new Date(event.start_time), "yyyy-MM-dd") ===
        fmtTz(date, "yyyy-MM-dd"),
    );
  };

  const getEventStyle = (event: any) => {
    return (
      EVENT_COLORS[event.event_type as keyof typeof EVENT_COLORS] ||
      EVENT_COLORS.other
    );
  };

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const getViewTitle = () => {
    if (viewMode === "month") {
      return fmtTz(currentDate, "MMMM yyyy");
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${fmtTz(weekStart, "d MMM")} - ${fmtTz(weekEnd, "d MMM yyyy")}`;
    } else {
      return fmtTz(currentDate, "d MMMM yyyy");
    }
  };

  // ============ MONTH VIEW ============
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const headerStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const headerDays = Array.from({ length: 7 }, (_, i) =>
      addDays(headerStart, i),
    );

    return (
      <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-border bg-background">
          {headerDays.map((d) => (
            <div
              key={d.toISOString()}
              className="py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              <span className="hidden md:inline">{fmtTz(d, "EEE")}</span>
              <span className="md:hidden">{fmtTz(d, "EEEEE")}</span>
            </div>
          ))}
        </div>
        <div
          className="grid grid-cols-7 flex-1"
          style={{ gridAutoRows: "1fr" }}
        >
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dayId = day.toISOString();
            const isLastCol = (index + 1) % 7 === 0;
            const isLastRow =
              Math.floor(index / 7) === Math.floor((days.length - 1) / 7);

            return (
              <Popover
                key={dayId}
                open={popoverOpenId === dayId}
                onOpenChange={(open) => {
                  setPopoverOpenId(open ? dayId : null);
                  if (!open) setEditingEventId(null);
                }}
              >
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      "relative p-1 md:p-2 transition-colors hover:bg-accent/5 min-h-[60px] md:min-h-[100px] cursor-pointer group",
                      !isLastCol && "border-r border-border/60",
                      !isLastRow && "border-b border-border/60",
                      !isCurrentMonth && "bg-muted/5 text-muted-foreground",
                    )}
                    onClick={() => {
                      setSelectedDate(day);
                      setEditingEventId(null);
                      onDateClick?.(day);
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={cn(
                          "text-xs md:text-sm font-medium w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full",
                          isToday
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : !isCurrentMonth
                              ? "text-muted-foreground/50"
                              : "text-foreground",
                        )}
                      >
                        {fmtTz(day, "d")}
                      </span>
                    </div>
                    <div className="space-y-0.5 md:space-y-1">
                      {dayEvents.slice(0, 3).map((event) => {
                        const colors = getEventStyle(event);
                        return (
                          <button
                            type="button"
                            key={event.id}
                            className={cn(
                              "w-full text-left px-1 md:px-2 py-0.5 rounded-sm text-[9px] md:text-[11px] font-medium truncate transition-all hover:brightness-95 border-l-2 md:border-l-[3px]",
                              colors.bg,
                              colors.text,
                              colors.border,
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEventId(event.id);
                              setPopoverOpenId(dayId);
                            }}
                          >
                            {event.title}
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] md:text-[10px] text-muted-foreground px-1 font-medium">
                          +{dayEvents.length - 3} till
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-transparent border-none shadow-none"
                  align="start"
                  side="right"
                  sideOffset={5}
                >
                  <div className="bg-background border rounded-xl shadow-xl">
                    <EventPopoverForm
                      slot={editingEventId ? undefined : day}
                      eventId={editingEventId}
                      onClose={() => {
                        setPopoverOpenId(null);
                        setEditingEventId(null);
                      }}
                      onSave={() => {}}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </div>
    );
  };

  // ============ WEEK VIEW ============
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const nowHour = now ? parseInt(fmtTz(now, "H"), 10) : 0;
    const nowMinute = now ? parseInt(fmtTz(now, "m"), 10) : 0;
    const nowTopPx = (nowHour * 60 + nowMinute) * (ROW_HEIGHT / 60);

    return (
      <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="grid grid-cols-8 border-b border-border bg-background shrink-0">
          <div className="py-2 md:py-3 text-center text-xs font-semibold text-muted-foreground"></div>
          {weekDays.map((d) => {
            const isToday = isSameDay(d, new Date());
            return (
              <div key={d.toISOString()} className="py-1 md:py-2 text-center">
                <div className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase">
                  <span className="hidden md:inline">{fmtTz(d, "EEE")}</span>
                  <span className="md:hidden">{fmtTz(d, "EEEEE")}</span>
                </div>
                <div
                  className={cn(
                    "text-sm md:text-lg font-semibold mt-0.5 md:mt-1 w-6 h-6 md:w-9 md:h-9 mx-auto flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {fmtTz(d, "d")}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex-1 overflow-auto">
          <div
            className="grid grid-cols-8 relative pt-3"
            style={{ minHeight: `${HOURS.length * ROW_HEIGHT + 12}px` }}
          >
            <div className="border-r border-border/60">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="pr-1 md:pr-2 text-right text-[10px] md:text-xs text-muted-foreground flex items-start justify-end"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <span className="-mt-2">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getEventsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isLastCol = dayIndex === 6;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative",
                    !isLastCol && "border-r border-border/60",
                  )}
                >
                  {HOURS.map((hour) => {
                    const parts = fmtTz(day, "yyyy-M-d").split("-").map(Number);
                    const y = parts[0] ?? 2024;
                    const mm = parts[1] ?? 1;
                    const dd = parts[2] ?? 1;
                    const local = new Date(y, mm - 1, dd, hour, 0, 0, 0);
                    const slotUtc = fromZonedTime(local, SWEDEN_TZ);
                    const slotId = `week-${day.toISOString()}-${hour}`;

                    return (
                      <Popover
                        key={hour}
                        open={popoverOpenId === slotId}
                        onOpenChange={(open) => {
                          setPopoverOpenId(open ? slotId : null);
                          if (!open) setEditingEventId(null);
                        }}
                      >
                        <PopoverTrigger asChild>
                          <div
                            className="border-b border-border/40 hover:bg-accent/10 cursor-pointer transition-colors"
                            style={{ height: `${ROW_HEIGHT}px` }}
                          />
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 bg-transparent border-none shadow-none"
                          align="start"
                          side="right"
                          sideOffset={5}
                        >
                          <div className="bg-background border rounded-xl shadow-xl">
                            <EventPopoverForm
                              slot={slotUtc}
                              onClose={() => setPopoverOpenId(null)}
                              onSave={() => {}}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                  {isToday && now && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${nowTopPx}px` }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                        <div className="flex-1 h-[2px] bg-red-500" />
                      </div>
                    </div>
                  )}
                  {(() => {
                    const layoutEvents = getEventLayout(dayEvents, fmtTz);
                    return layoutEvents.map(
                      ({
                        event,
                        columnIndex,
                        columnCount,
                        startMinutes,
                        endMinutes,
                      }) => {
                        const topPx =
                          startMinutes * (ROW_HEIGHT / 60) + EVENT_VERTICAL_GAP;
                        const durationMin = endMinutes - startMinutes;
                        const heightPx = Math.max(
                          durationMin * (ROW_HEIGHT / 60) -
                            EVENT_VERTICAL_GAP * 2,
                          24,
                        );
                        const colors = getEventStyle(event);
                        const eventSlotId = `week-event-${event.id}`;

                        // Calculate horizontal position for side-by-side layout
                        const columnWidth =
                          (100 -
                            (EVENT_PADDING_LEFT + EVENT_PADDING_RIGHT) / 10) /
                          columnCount;
                        const leftPercent =
                          EVENT_PADDING_LEFT / 10 + columnIndex * columnWidth;
                        const widthPercent =
                          columnWidth - EVENT_HORIZONTAL_GAP / 10;

                        return (
                          <Popover
                            key={event.id}
                            open={popoverOpenId === eventSlotId}
                            onOpenChange={(open) => {
                              setPopoverOpenId(open ? eventSlotId : null);
                              if (open) setEditingEventId(event.id);
                              else setEditingEventId(null);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  "absolute rounded-md px-1 md:px-2 py-0.5 md:py-1 text-[9px] md:text-xs font-medium overflow-hidden z-10 border-l-2 md:border-l-[3px] shadow-sm cursor-pointer hover:brightness-95 hover:shadow-md transition-all text-left",
                                  colors.bg,
                                  colors.text,
                                  colors.border,
                                )}
                                style={{
                                  top: `${topPx}px`,
                                  height: `${heightPx}px`,
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                }}
                              >
                                <div className="truncate">{event.title}</div>
                                <div className="text-[8px] md:text-[10px] opacity-70 hidden md:block">
                                  {fmtTz(event.start_time, "HH:mm")} -{" "}
                                  {fmtTz(event.end_time, "HH:mm")}
                                </div>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0 bg-transparent border-none shadow-none"
                              align="start"
                              side="right"
                              sideOffset={5}
                            >
                              <div className="bg-background border rounded-xl shadow-xl">
                                <EventPopoverForm
                                  eventId={event.id}
                                  onClose={() => {
                                    setPopoverOpenId(null);
                                    setEditingEventId(null);
                                  }}
                                  onSave={() => {}}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      },
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ============ DAY VIEW ============
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const isToday = isSameDay(currentDate, new Date());
    const nowHour = now ? parseInt(fmtTz(now, "H"), 10) : 0;
    const nowMinute = now ? parseInt(fmtTz(now, "m"), 10) : 0;
    const nowTopPx = (nowHour * 60 + nowMinute) * (ROW_HEIGHT / 60);

    return (
      <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="py-3 md:py-4 px-4 md:px-6 border-b border-border bg-background text-center shrink-0">
          <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase">
            {fmtTz(currentDate, "EEEE")}
          </div>
          <div
            className={cn(
              "text-2xl md:text-3xl font-bold mt-1 w-10 h-10 md:w-14 md:h-14 mx-auto flex items-center justify-center rounded-full",
              isToday && "bg-primary text-primary-foreground",
            )}
          >
            {fmtTz(currentDate, "d")}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground mt-1">
            {fmtTz(currentDate, "MMMM yyyy")}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div
            className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] relative pt-3"
            style={{ minHeight: `${HOURS.length * ROW_HEIGHT + 12}px` }}
          >
            <div className="border-r border-border/60">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="pr-2 md:pr-3 text-right text-[10px] md:text-xs text-muted-foreground flex items-start justify-end"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <span className="-mt-2">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>
            <div className="relative">
              {HOURS.map((hour) => {
                const parts = fmtTz(currentDate, "yyyy-M-d")
                  .split("-")
                  .map(Number);
                const y = parts[0] ?? 2024;
                const mm = parts[1] ?? 1;
                const dd = parts[2] ?? 1;
                const local = new Date(y, mm - 1, dd, hour, 0, 0, 0);
                const slotUtc = fromZonedTime(local, SWEDEN_TZ);
                const slotId = `day-${currentDate.toISOString()}-${hour}`;

                return (
                  <Popover
                    key={hour}
                    open={popoverOpenId === slotId}
                    onOpenChange={(open) =>
                      setPopoverOpenId(open ? slotId : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <div
                        className="border-b border-border/40 hover:bg-accent/10 cursor-pointer transition-colors"
                        style={{ height: `${ROW_HEIGHT}px` }}
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-transparent border-none shadow-none"
                      align="start"
                      side="right"
                      sideOffset={5}
                    >
                      <div className="bg-background border rounded-xl shadow-xl">
                        <EventPopoverForm
                          slot={slotUtc}
                          onClose={() => setPopoverOpenId(null)}
                          onSave={() => {}}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
              {isToday && now && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: `${nowTopPx}px` }}
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 border-2 border-white shadow" />
                    <div className="flex-1 h-[2px] bg-red-500" />
                  </div>
                </div>
              )}
              {(() => {
                const layoutEvents = getEventLayout(dayEvents, fmtTz);
                return layoutEvents.map(
                  ({
                    event,
                    columnIndex,
                    columnCount,
                    startMinutes,
                    endMinutes,
                  }) => {
                    const topPx =
                      startMinutes * (ROW_HEIGHT / 60) + EVENT_VERTICAL_GAP;
                    const durationMin = endMinutes - startMinutes;
                    const heightPx = Math.max(
                      durationMin * (ROW_HEIGHT / 60) - EVENT_VERTICAL_GAP * 2,
                      30,
                    );
                    const colors = getEventStyle(event);
                    const eventSlotId = `day-event-${event.id}`;

                    // Calculate horizontal position for side-by-side layout
                    const columnWidth =
                      (100 - (EVENT_PADDING_LEFT + EVENT_PADDING_RIGHT) / 10) /
                      columnCount;
                    const leftPercent =
                      EVENT_PADDING_LEFT / 10 + columnIndex * columnWidth;
                    const widthPercent =
                      columnWidth - EVENT_HORIZONTAL_GAP / 10;

                    return (
                      <Popover
                        key={event.id}
                        open={popoverOpenId === eventSlotId}
                        onOpenChange={(open) => {
                          setPopoverOpenId(open ? eventSlotId : null);
                          if (open) setEditingEventId(event.id);
                          else setEditingEventId(null);
                        }}
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "absolute rounded-lg px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-medium overflow-hidden z-10 border-l-[3px] md:border-l-[4px] shadow-md cursor-pointer hover:brightness-95 hover:shadow-lg transition-all text-left",
                              colors.bg,
                              colors.text,
                              colors.border,
                            )}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                          >
                            <div className="font-semibold truncate">
                              {event.title}
                            </div>
                            <div className="text-[10px] md:text-xs opacity-70 mt-0.5">
                              {fmtTz(event.start_time, "HH:mm")} -{" "}
                              {fmtTz(event.end_time, "HH:mm")}
                            </div>
                            {event.description && heightPx > 60 && (
                              <div className="text-[10px] md:text-xs opacity-60 mt-1 line-clamp-2 hidden md:block">
                                {event.description}
                              </div>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 bg-transparent border-none shadow-none"
                          align="start"
                          side="right"
                          sideOffset={5}
                        >
                          <div className="bg-background border rounded-xl shadow-xl">
                            <EventPopoverForm
                              eventId={event.id}
                              onClose={() => {
                                setPopoverOpenId(null);
                                setEditingEventId(null);
                              }}
                              onSave={() => {}}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  },
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============ MAIN RETURN ============
  return (
    <div className="flex flex-col h-full gap-2 md:gap-4 px-2 md:px-6 py-2 md:py-4">
      {/* Top Navigation Bar - Mobile Responsive */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
        {/* Title and Navigation */}
        <div className="flex items-center justify-between md:justify-start gap-2 md:gap-4">
          <h2 className="text-lg md:text-2xl font-bold text-foreground min-w-0 md:min-w-[220px] truncate">
            {getViewTitle()}
          </h2>
          <div className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border/50">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 md:h-7 md:w-7 rounded-md hover:bg-background hover:shadow-sm"
              onClick={() => navigateDate("prev")}
            >
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 md:h-7 px-2 md:px-3 text-[10px] md:text-xs font-medium rounded-md hover:bg-background hover:shadow-sm"
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDate(new Date());
              }}
            >
              Idag
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 md:h-7 md:w-7 rounded-md hover:bg-background hover:shadow-sm"
              onClick={() => navigateDate("next")}
            >
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>

        {/* Search, Filter, View Toggle, Sidebar Toggle */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search - Hidden on mobile, shown on md+ */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök händelser..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 w-[180px] bg-muted/30 border-border/50"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-foreground"
              >
                <Filter className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {Object.entries(EVENT_COLORS).map(([key, val]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={activeFilters.includes(key)}
                  onCheckedChange={() => toggleFilter(key)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full",
                        val.border.replace("border-", "bg-"),
                      )}
                    />
                    {val.label}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex bg-muted/30 rounded-lg p-0.5 md:p-1 border border-border/50">
            {(["day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-sm font-medium rounded-md transition-all",
                  viewMode === mode
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === "day" ? "Dag" : mode === "week" ? "Vecka" : "Månad"}
              </button>
            ))}
          </div>

          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 md:h-8 md:w-8 hidden md:flex",
              sidebarOpen
                ? "text-muted-foreground"
                : "bg-accent/50 text-foreground",
            )}
            onClick={onToggleSidebar}
          >
            <PanelRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Search - Shown only on mobile */}
      <div className="md:hidden relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök händelser..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-8 bg-muted/30 border-border/50"
        />
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 min-h-0">
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDayView()}
      </div>
    </div>
  );
}
