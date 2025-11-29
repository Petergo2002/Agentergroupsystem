"use client";

import type { LucideIcon } from "lucide-react";
import {
  FileText,
  MessageSquare,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reusable empty state component for lists and pages with no data
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button onClick={action.onClick}>
            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// Pre-configured empty states for common use cases

interface PresetEmptyStateProps {
  onAction?: () => void;
  className?: string;
}

export function EmptyContacts({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Users}
      title="Inga kontakter ännu"
      description="Lägg till din första kontakt för att börja hantera dina kundrelationer."
      action={
        onAction
          ? {
              label: "Lägg till kontakt",
              onClick: onAction,
              icon: Plus,
            }
          : undefined
      }
      className={className}
    />
  );
}

export function EmptyReports({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={FileText}
      title="Inga rapporter ännu"
      description="Skapa din första rapportmall för att börja generera professionella rapporter."
      action={
        onAction
          ? {
              label: "Skapa rapportmall",
              onClick: onAction,
              icon: Plus,
            }
          : undefined
      }
      className={className}
    />
  );
}

export function EmptyAssistants({
  onAction,
  className,
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="AI-assistenter inte konfigurerade"
      description="Konfigurera Vapi-integration för att använda AI-assistenter i din organisation."
      action={
        onAction
          ? {
              label: "Konfigurera AI",
              onClick: onAction,
              icon: Settings,
            }
          : undefined
      }
      className={className}
    />
  );
}

export function EmptyWidget({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Ingen chattwidget konfigurerad"
      description="Konfigurera din chattwidget för att låta besökare kontakta dig direkt från din webbplats."
      action={
        onAction
          ? {
              label: "Konfigurera widget",
              onClick: onAction,
              icon: Settings,
            }
          : undefined
      }
      className={className}
    />
  );
}

export function EmptyEvents({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={FileText}
      title="Inga händelser"
      description="Lägg till din första händelse i kalendern."
      action={
        onAction
          ? {
              label: "Lägg till händelse",
              onClick: onAction,
              icon: Plus,
            }
          : undefined
      }
      className={className}
    />
  );
}

export function EmptyTasks({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={FileText}
      title="Inga uppgifter"
      description="Skapa din första uppgift för att hålla koll på ditt arbete."
      action={
        onAction
          ? {
              label: "Skapa uppgift",
              onClick: onAction,
              icon: Plus,
            }
          : undefined
      }
      className={className}
    />
  );
}

export function EmptyAnalytics({ className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Ingen data ännu"
      description="Data kommer att visas här efter att du börjar använda AI-assistenter och chattfunktioner."
      className={className}
    />
  );
}
