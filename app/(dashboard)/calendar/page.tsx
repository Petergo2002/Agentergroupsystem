"use client";

import { useState } from "react";
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar";
import { CalendarView } from "@/components/calendar/calendar-view";
import { EventDetailsDialog } from "@/components/calendar/event-details-dialog";
import { EventDialog } from "@/components/calendar/event-dialog";

export default function CalendarPage() {
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleDateClick = (date: Date) => {
    // Optional: could open event dialog for the clicked date
    void date;
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setDetailsOpen(true);
  };

  const handleAddEvent = (date: Date) => {
    setSelectedSlot(date);
    setSelectedEventId(null);
    setEventDialogOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Main Content - Now on the left */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 p-0 overflow-auto">
          <CalendarView
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            onAddEvent={handleAddEvent}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
      </div>

      {/* Sidebar - Now on the right */}
      <div
        className={`${
          sidebarOpen ? "w-[280px]" : "w-0"
        } transition-all duration-300 ease-in-out overflow-hidden shrink-0 border-l border-border bg-card`}
      >
        <div className="w-[280px] h-full">
          <CalendarSidebar />
        </div>
      </div>

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        slot={selectedSlot}
        onEventCreated={(event) => {
          setSelectedEventId(event.id);
          setDetailsOpen(true);
        }}
      />

      <EventDetailsDialog
        open={detailsOpen && Boolean(selectedEventId)}
        eventId={selectedEventId}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedEventId(null);
          }
        }}
      />
    </div>
  );
}
