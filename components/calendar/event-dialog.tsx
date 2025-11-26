"use client";

import { addDays, addMinutes } from "date-fns";
import { sv } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createEvent, useEventsStore } from "@/lib/store";
import { SWEDEN_TZ } from "@/lib/utils";

type CalendarEvent = Awaited<ReturnType<typeof createEvent>>;

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: Date | null;
  onEventCreated?: (event: CalendarEvent) => void;
}

export function EventDialog({
  open,
  onOpenChange,
  slot,
  onEventCreated,
}: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(""); // yyyy-MM-dd
  const [startTime, setStartTime] = useState(""); // HH:mm
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [status, setStatus] = useState<"busy" | "available">("busy");
  const [eventType, setEventType] = useState<
    "showing" | "meeting" | "call" | "open-house" | "other"
  >("meeting");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Build hour options 00:00 .. 23:00
  const hourOptions = useMemo(() => {
    return Array.from(
      { length: 24 },
      (_, h) => `${String(h).padStart(2, "0")}:00`,
    );
  }, []);

  // Prefill from provided slot
  useEffect(() => {
    if (!open) return;
    const base = slot ?? new Date();
    const startLocalDate = formatInTimeZone(base, SWEDEN_TZ, "yyyy-MM-dd", {
      locale: sv,
    });
    const startLocalHH = formatInTimeZone(base, SWEDEN_TZ, "HH", {
      locale: sv,
    });
    const end = addMinutes(base, 60);
    const endLocalDate = formatInTimeZone(end, SWEDEN_TZ, "yyyy-MM-dd", {
      locale: sv,
    });
    const endLocalHH = formatInTimeZone(end, SWEDEN_TZ, "HH", { locale: sv });

    setTitle("");
    setStartDate(startLocalDate);
    // Snap to hour for dropdown
    setStartTime(`${startLocalHH}:00`);
    setEndDate(endLocalDate);
    setEndTime(`${endLocalHH}:00`);
    setAllDay(false);
    setStatus("busy");
    setEventType("meeting");
    setDescription("");
  }, [open, slot]);

  // Ensure end >= start (simple check within same timezone strings HH:mm and possibly different dates)
  useEffect(() => {
    if (allDay) return;
    if (!startDate || !endDate || !startTime || !endTime) return;
    const [syStr, smStr, sdStr] = startDate.split("-");
    const [eyStr, emStr, edStr] = endDate.split("-");
    const [shStr, sminStr] = startTime.split(":");
    const [ehStr, eminStr] = endTime.split(":");

    const sy = Number(syStr) || 0;
    const sm = Number(smStr) || 1;
    const sd = Number(sdStr) || 1;
    const ey = Number(eyStr) || sy;
    const em = Number(emStr) || sm;
    const ed = Number(edStr) || sd;
    const sh = Number(shStr) || 0;
    const smin = Number(sminStr) || 0;
    const eh = Number(ehStr) || 0;
    const emin = Number(eminStr) || 0;

    const s = new Date(sy, sm - 1, sd, sh, smin, 0, 0);
    const e = new Date(ey, em - 1, ed, eh, emin, 0, 0);
    if (e <= s) {
      // auto set end to start + 1h
      const plus = addMinutes(s, 60);
      const ny = plus.getFullYear();
      const nm = String(plus.getMonth() + 1).padStart(2, "0");
      const nd = String(plus.getDate()).padStart(2, "0");
      const nh = String(plus.getHours()).padStart(2, "0");
      setEndDate(`${ny}-${nm}-${nd}`);
      setEndTime(`${nh}:00`);
    }
  }, [allDay, startDate, endDate, startTime, endTime]);

  const onSave = async () => {
    if (!title.trim()) {
      toast.error("Titel krävs");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Välj start och slutdatum");
      return;
    }

    try {
      setSaving(true);

      let startLocal: Date;
      let endLocal: Date;

      if (allDay) {
        // All-day: 00:00 local to next day 00:00 local
        const [syStr, smStr, sdStr] = startDate.split("-");
        const [eyStr, emStr, edStr] = endDate.split("-");
        const sy = Number(syStr) || 0;
        const sm = Number(smStr) || 1;
        const sd = Number(sdStr) || 1;
        const ey = Number(eyStr) || sy;
        const em = Number(emStr) || sm;
        const ed = Number(edStr) || sd;

        startLocal = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        // End at 00:00 of the day AFTER endDate for exclusive end
        const endBase = new Date(
          ey,
          em - 1,
          ed,
          0,
          0,
          0,
          0,
        );
        endLocal = addDays(endBase, 1);
      } else {
        const [syStr, smStr, sdStr] = startDate.split("-");
        const [eyStr, emStr, edStr] = endDate.split("-");
        const [shStr, sminStr] = (startTime || "00:00").split(":");
        const [ehStr, eminStr] = (endTime || "00:00").split(":");

        const sy = Number(syStr) || 0;
        const sm = Number(smStr) || 1;
        const sd = Number(sdStr) || 1;
        const ey = Number(eyStr) || sy;
        const em = Number(emStr) || sm;
        const ed = Number(edStr) || sd;
        const sh = Number(shStr) || 0;
        const smin = Number(sminStr) || 0;
        const eh = Number(ehStr) || 0;
        const emin = Number(eminStr) || 0;

        startLocal = new Date(sy, sm - 1, sd, sh, smin, 0, 0);
        endLocal = new Date(
          ey,
          em - 1,
          ed,
          eh,
          emin,
          0,
          0,
        );
      }

      const startUtc = fromZonedTime(startLocal, SWEDEN_TZ);
      const endUtc = fromZonedTime(endLocal, SWEDEN_TZ);

      const newEvent = await createEvent({
        title: title.trim(),
        start_time: startUtc.toISOString(),
        end_time: endUtc.toISOString(),
        status,
        description: description.trim() || null,
        event_type: eventType,
      });

      // Update store optimistically
      useEventsStore.getState().addEvent(newEvent as any);
      toast.success("Händelse skapad");
      onEventCreated?.(newEvent);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Kunde inte skapa händelse");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-background">
        <DialogHeader>
          <DialogTitle>Skapa händelse</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <Label htmlFor="event-title" className="text-sm font-medium">
              Titel
            </Label>
            <Input
              id="event-title"
              placeholder="Lägg till titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Date & time row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
            <div>
              <Label className="mb-1 block text-sm font-medium">Start</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                {!allDay && (
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tid" />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map((opt) => (
                        <SelectItem key={`st-${opt}`} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center pt-6">
              till
            </div>

            <div>
              <Label className="mb-1 block text-sm font-medium">Slut</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                {!allDay && (
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tid" />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map((opt) => (
                        <SelectItem key={`et-${opt}`} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex items-center gap-3">
              <Switch
                id="all-day"
                checked={allDay}
                onCheckedChange={setAllDay}
              />
              <Label htmlFor="all-day" className="text-sm font-medium">
                Heldag
              </Label>
            </div>

            <div className="md:ml-auto space-y-2">
              <Label className="block text-sm font-medium">Status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as "busy" | "available")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="busy">Upptagen</SelectItem>
                  <SelectItem value="available">Tillgänglig</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="block text-sm font-medium">
              Typ av händelse
            </Label>
            <Select
              value={eventType}
              onValueChange={(value) =>
                setEventType(
                  value as
                    | "showing"
                    | "meeting"
                    | "call"
                    | "open-house"
                    | "other",
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="showing">Visning</SelectItem>
                <SelectItem value="meeting">Möte</SelectItem>
                <SelectItem value="call">Samtal</SelectItem>
                <SelectItem value="open-house">Öppen visning</SelectItem>
                <SelectItem value="other">Övrigt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="event-description" className="text-sm font-medium">
              Beskrivning
            </Label>
            <Textarea
              id="event-description"
              className="min-h-[120px]"
              placeholder="Lägg till en beskrivning"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Sparar…" : "Spara"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
