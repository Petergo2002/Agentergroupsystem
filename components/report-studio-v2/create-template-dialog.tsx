"use client";

/**
 * Create Template Dialog
 * 
 * Dialog för att skapa en ny mall.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconDroplet, IconHammer, IconBolt } from "@tabler/icons-react";
import { useSimpleReportStore } from "@/stores/simpleReportStore";
import type { ReportTrade } from "@/lib/types/rapport";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateTemplateDialog({ open, onOpenChange, onCreated }: CreateTemplateDialogProps) {
  const { addTemplate } = useSimpleReportStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trade, setTrade] = useState<ReportTrade>("läckage");

  const handleSubmit = () => {
    if (!name.trim()) return;

    addTemplate({
      name: name.trim(),
      description: description.trim() || undefined,
      trade,
      sections: [],
    });

    // Reset och stäng
    setName("");
    setDescription("");
    setTrade("läckage");
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-white/10">
        <DialogHeader>
          <DialogTitle>Skapa ny mall</DialogTitle>
          <DialogDescription>
            Ge din mall ett namn och välj bransch. Du kan lägga till sektioner efteråt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Namn */}
          <div>
            <Label>Mallnamn *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Läckagerapport, Besiktningsprotokoll..."
              className="mt-1 bg-white/5 border-white/10"
              autoFocus
            />
          </div>

          {/* Bransch */}
          <div>
            <Label>Bransch</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { value: "läckage" as ReportTrade, label: "Läckage", icon: IconDroplet, color: "emerald" },
                { value: "bygg" as ReportTrade, label: "Bygg", icon: IconHammer, color: "orange" },
                { value: "elektriker" as ReportTrade, label: "Elektriker", icon: IconBolt, color: "yellow" },
              ].map((option) => {
                const Icon = option.icon;
                const isSelected = trade === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTrade(option.value)}
                    className={`
                      p-4 rounded-lg border text-center transition-all
                      ${isSelected 
                        ? `bg-${option.color}-500/20 border-${option.color}-500` 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                      }
                    `}
                    style={{
                      backgroundColor: isSelected ? `var(--${option.color}-500-20, rgba(16, 185, 129, 0.2))` : undefined,
                      borderColor: isSelected ? `var(--${option.color}-500, #10b981)` : undefined,
                    }}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? "text-emerald-400" : "text-gray-400"}`} />
                    <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-300"}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Beskrivning */}
          <div>
            <Label>Beskrivning (valfritt)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivning av vad mallen används till..."
              className="mt-1 bg-white/5 border-white/10 resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Skapa mall
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTemplateDialog;
