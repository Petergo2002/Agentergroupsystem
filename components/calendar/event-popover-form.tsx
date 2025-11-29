"use client";

import { sv } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  AlignLeft,
  CalendarIcon,
  ChevronDown,
  Clock,
  Repeat,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import {
  createEvent,
  deleteEventById,
  updateEventById,
  useCustomersStore,
  useEventsStore,
} from "@/lib/store";
import { cn, SWEDEN_TZ } from "@/lib/utils";

interface EventPopoverFormProps {
  slot?: Date;
  eventId?: string | null;
  onClose: () => void;
  onSave: (event: any) => void;
}

// Generate time options for dropdown (every 15 minutes)
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

const EVENT_TYPES = [
  { value: "meeting", label: "Möte", color: "bg-pink-500" },
  { value: "call", label: "Samtal", color: "bg-green-500" },
  { value: "showing", label: "Visning", color: "bg-blue-500" },
  { value: "open-house", label: "Öppet hus", color: "bg-purple-500" },
  { value: "other", label: "Övrigt", color: "bg-orange-500" },
] as const;

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Upprepas inte" },
  { value: "daily", label: "Varje dag" },
  { value: "weekly", label: "Varje vecka" },
  { value: "biweekly", label: "Varannan vecka" },
  { value: "monthly", label: "Varje månad" },
] as const;

function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    const match = inputValue.match(/^(\d{1,2}):?(\d{2})?$/);
    if (match) {
      const hours = Math.min(23, Math.max(0, parseInt(match[1] ?? "0", 10)));
      const minutes = match[2]
        ? Math.min(59, Math.max(0, parseInt(match[2] ?? "0", 10)))
        : 0;
      const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      setInputValue(formatted);
      onChange(formatted);
    } else {
      setInputValue(value);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-[70px] bg-transparent border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary pr-6"
            placeholder="00:00"
          />
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[100px] p-1 max-h-[200px] overflow-auto"
        align="start"
      >
        <div className="space-y-0.5">
          {TIME_OPTIONS.map((time) => (
            <button
              key={time}
              type="button"
              className={cn(
                "w-full text-left px-2 py-1 text-sm rounded hover:bg-accent transition-colors",
                time === value &&
                  "bg-primary text-primary-foreground hover:bg-primary",
              )}
              onClick={() => {
                onChange(time);
                setInputValue(time);
                setOpen(false);
              }}
            >
              {time}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EventPopoverForm({
  slot,
  eventId,
  onClose,
  onSave,
}: EventPopoverFormProps) {
  const events = useEventsStore((s) => s.events);
  const customers = useCustomersStore((s) => s.customers);
  const _updateEvent = useEventsStore((s) => s.updateEvent);

  const existingEvent = eventId ? events.find((e) => e.id === eventId) : null;
  const isEditing = !!existingEvent;

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<string>("meeting");
  const [contactId, setContactId] = useState<string>("");
  const [recurrence, setRecurrence] = useState<string>("none");
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Initialize from existing event or slot
  useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.title);
      setDescription(existingEvent.description || "");
      setEventType(existingEvent.event_type || "meeting");
      setContactId(existingEvent.contact_id || "");

      const dateStr = formatInTimeZone(
        existingEvent.start_time,
        SWEDEN_TZ,
        "yyyy-MM-dd",
        { locale: sv },
      );
      setStartDate(dateStr);

      const startH = formatInTimeZone(
        existingEvent.start_time,
        SWEDEN_TZ,
        "HH",
        { locale: sv },
      );
      const startM = formatInTimeZone(
        existingEvent.start_time,
        SWEDEN_TZ,
        "mm",
        { locale: sv },
      );
      setStartTime(`${startH}:${startM}`);

      const endH = formatInTimeZone(existingEvent.end_time, SWEDEN_TZ, "HH", {
        locale: sv,
      });
      const endM = formatInTimeZone(existingEvent.end_time, SWEDEN_TZ, "mm", {
        locale: sv,
      });
      setEndTime(`${endH}:${endM}`);
    } else if (slot) {
      const dateStr = formatInTimeZone(slot, SWEDEN_TZ, "yyyy-MM-dd", {
        locale: sv,
      });
      setStartDate(dateStr);

      const slotH = parseInt(
        formatInTimeZone(slot, SWEDEN_TZ, "HH", { locale: sv }),
        10,
      );
      const slotM = parseInt(
        formatInTimeZone(slot, SWEDEN_TZ, "mm", { locale: sv }),
        10,
      );

      if (slotH !== 0 || slotM !== 0) {
        setStartTime(
          `${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}`,
        );
        const endH = (slotH + 1) % 24;
        setEndTime(
          `${String(endH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}`,
        );
      }
    }
  }, [slot, existingEvent]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Ange en titel");
      return;
    }

    setSaving(true);
    try {
      const dateParts = startDate.split("-").map(Number);
      const y = dateParts[0] ?? 2024;
      const m = dateParts[1] ?? 1;
      const d = dateParts[2] ?? 1;

      const startParts = startTime.split(":").map(Number);
      const sh = startParts[0] ?? 0;
      const sm = startParts[1] ?? 0;

      const endParts = endTime.split(":").map(Number);
      const eh = endParts[0] ?? 0;
      const em = endParts[1] ?? 0;

      let startUtc: Date;
      let endUtc: Date;

      if (allDay) {
        const startLocal = new Date(y, m - 1, d, 0, 0, 0);
        const endLocal = new Date(y, m - 1, d, 23, 59, 59);
        startUtc = fromZonedTime(startLocal, SWEDEN_TZ);
        endUtc = fromZonedTime(endLocal, SWEDEN_TZ);
      } else {
        const startLocal = new Date(y, m - 1, d, sh, sm, 0);
        const endLocal = new Date(y, m - 1, d, eh, em, 0);
        startUtc = fromZonedTime(startLocal, SWEDEN_TZ);
        endUtc = fromZonedTime(endLocal, SWEDEN_TZ);
      }

      if (isEditing && existingEvent) {
        // Update existing event (persist to Supabase and sync store)
        const updated = await updateEventById(existingEvent.id, {
          title,
          start_time: startUtc.toISOString(),
          end_time: endUtc.toISOString(),
          description: description || null,
          event_type: eventType as any,
          contact_id: contactId || null,
        });
        toast.success("Händelse uppdaterad");
        onSave(updated);
      } else {
        // Create new event
        const newEvent = await createEvent({
          title,
          start_time: startUtc.toISOString(),
          end_time: endUtc.toISOString(),
          status: "busy",
          description: description || null,
          event_type: eventType as any,
          contact_id: contactId || null,
        });

        useEventsStore.getState().addEvent(newEvent as any);
        toast.success("Händelse skapad");
        onSave(newEvent);
      }

      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        isEditing
          ? "Kunde inte uppdatera händelse"
          : "Kunde inte skapa händelse",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEvent) return;
    setDeleting(true);
    try {
      await deleteEventById(existingEvent.id);
      toast.success("Händelse borttagen");
      setDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte ta bort händelse");
    } finally {
      setDeleting(false);
    }
  };

  const selectedEventType = EVENT_TYPES.find((t) => t.value === eventType);

  return (
    <>
      <div className="w-[340px] p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">
            {isEditing ? "Redigera händelse" : "Ny händelse"}
          </h4>
          <div className="flex items-center gap-1">
            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <span className="sr-only">Stäng</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
              >
                <path
                  d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.1929 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.1929 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        </div>

        <Input
          placeholder="Händelsenamn"
          className="text-lg font-medium border-none px-0 focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/50"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <div className="space-y-3">
          {/* Event Type */}
          <div className="flex items-center gap-3 text-sm">
            <div
              className={cn(
                "h-4 w-4 rounded-full shrink-0",
                selectedEventType?.color || "bg-gray-400",
              )}
            />
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="h-8 border-none shadow-none px-0 focus:ring-0">
                <SelectValue placeholder="Välj typ" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", type.color)} />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">
                {startDate
                  ? formatInTimeZone(
                      new Date(startDate),
                      SWEDEN_TZ,
                      "EEEE, d MMM",
                      { locale: sv },
                    )
                  : "Välj datum"}
              </div>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              {!allDay && (
                <>
                  <TimeSelect value={startTime} onChange={setStartTime} />
                  <span className="text-muted-foreground">→</span>
                  <TimeSelect value={endTime} onChange={setEndTime} />
                </>
              )}
              {allDay && (
                <span className="text-muted-foreground">Hela dagen</span>
              )}
            </div>
          </div>

          {/* All day toggle */}
          <div className="flex items-center gap-3 text-sm ml-7">
            <div className="flex items-center gap-2">
              <Switch
                id="all-day-switch"
                checked={allDay}
                onCheckedChange={setAllDay}
                className="scale-75 origin-left"
              />
              <Label
                htmlFor="all-day-switch"
                className="font-normal text-muted-foreground cursor-pointer"
              >
                Heldag
              </Label>
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select
              value={contactId || "none"}
              onValueChange={(val) => setContactId(val === "none" ? "" : val)}
            >
              <SelectTrigger className="h-8 border-none shadow-none px-0 focus:ring-0 flex-1">
                <SelectValue placeholder="Välj kontakt (valfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen kontakt</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurrence */}
          <div className="flex items-center gap-3 text-sm">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger className="h-8 border-none shadow-none px-0 focus:ring-0 flex-1">
                <SelectValue placeholder="Upprepning" />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="flex items-start gap-3 text-sm">
            <AlignLeft className="h-4 w-4 text-muted-foreground mt-0.5" />
            <Input
              placeholder="Beskrivning"
              className="h-8 border-none shadow-none px-0 py-0 focus-visible:ring-0 placeholder:text-muted-foreground"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Avbryt
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Sparar..." : isEditing ? "Uppdatera" : "Spara"}
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort händelse?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort denna händelse? Detta går inte
              att ångra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Tar bort..." : "Ta bort"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
