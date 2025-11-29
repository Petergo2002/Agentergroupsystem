"use client";

import { sv } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { deleteEventById, useEventsStore } from "@/lib/store";
import { SWEDEN_TZ } from "@/lib/utils";

interface EventDetailsDialogProps {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_LABEL: Record<string, string> = {
  busy: "Upptagen",
  available: "Tillgänglig",
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  showing: "Visning",
  meeting: "Möte",
  call: "Samtal",
  "open-house": "Öppen visning",
  other: "Övrigt",
};

export function EventDetailsDialog({
  eventId,
  open,
  onOpenChange,
}: EventDetailsDialogProps) {
  const events = useEventsStore((state) => state.events);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const event = useMemo(
    () => events.find((e) => e.id === eventId) ?? null,
    [events, eventId],
  );

  const formattedTime = useMemo(() => {
    if (!event) return { start: "", end: "" };
    return {
      start: formatInTimeZone(
        event.start_time,
        SWEDEN_TZ,
        "EEEE d MMMM yyyy • HH:mm",
        { locale: sv },
      ),
      end: formatInTimeZone(
        event.end_time,
        SWEDEN_TZ,
        "EEEE d MMMM yyyy • HH:mm",
        { locale: sv },
      ),
    };
  }, [event]);

  const handleDelete = async () => {
    if (!event) return;
    try {
      setDeleting(true);
      await deleteEventById(event.id);
      toast.success("Händelsen har tagits bort");
      setConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Kunde inte ta bort händelsen");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span>{event?.title ?? "Händelse"}</span>
              {event && (
                <Badge
                  variant={
                    event.status === "busy" ? "destructive" : "secondary"
                  }
                >
                  {STATUS_LABEL[event.status] ?? event.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {event ? (
            <div className="space-y-4">
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">Start</p>
                  <p>{formattedTime.start}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Slut</p>
                  <p>{formattedTime.end}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Typ</p>
                  <p>
                    {event.event_type
                      ? (EVENT_TYPE_LABEL[event.event_type] ?? event.event_type)
                      : "Inte angiven"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Beskrivning
                </p>
                <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground whitespace-pre-line">
                  {event.description || "Ingen beskrivning angiven"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Händelsen kunde inte hittas.
            </p>
          )}

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Stäng
            </Button>
            {event && (
              <Button
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
              >
                Ta bort
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort händelsen?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta går inte att ångra och händelsen kommer att tas bort
              permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Avbryt
            </Button>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Tar bort…" : "Ta bort"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
