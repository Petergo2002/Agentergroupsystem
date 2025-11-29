"use client";

import {
  IconCheck,
  IconFileText,
  IconHeading,
  IconLink,
  IconList,
  IconPhoto,
  IconSeparator,
  IconSignature,
  IconTable,
} from "@tabler/icons-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  ReportSectionInstance,
  ReportSectionType,
  SectionGroup,
} from "@/lib/types/rapport";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface SectionNavProps {
  sections: ReportSectionInstance[];
  groups?: SectionGroup[];
  activeSectionId: string | null;
  onSelectSection: (id: string) => void;
  onReorderSection?: (id: string, direction: "up" | "down") => void;
}

// ============================================================================
// Constants
// ============================================================================

const SECTION_ICONS: Record<ReportSectionType, React.ReactNode> = {
  text: <IconFileText className="size-4" />,
  heading: <IconHeading className="size-4" />,
  summary: <IconFileText className="size-4" />,
  basic_info: <IconFileText className="size-4" />,
  image: <IconPhoto className="size-4" />,
  image_gallery: <IconPhoto className="size-4" />,
  image_annotated: <IconPhoto className="size-4" />,
  checklist: <IconList className="size-4" />,
  table: <IconTable className="size-4" />,
  signature: <IconSignature className="size-4" />,
  divider: <IconSeparator className="size-4" />,
  links: <IconLink className="size-4" />,
  chart: <IconTable className="size-4" />,
};

// ============================================================================
// Component
// ============================================================================

export function SectionNav({
  sections,
  groups = [],
  activeSectionId,
  onSelectSection,
  onReorderSection,
}: SectionNavProps) {
  const [_collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  // Calculate progress
  const completedCount = sections.filter(
    (s) => s.status === "completed",
  ).length;
  const totalCount = sections.length;
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Group sections
  const _groupedSections =
    groups.length > 0
      ? groups.map((group) => ({
          ...group,
          sections: sections.filter((_s) => {
            // Match by group field or by order range
            return true; // For now, show all in each group
          }),
        }))
      : [{ id: "default", title: "Sektioner", sections, order: 0 }];

  const _toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      {/* Header */}
      <div className="border-b p-4">
        <h3 className="font-semibold">Sektioner</h3>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Framsteg</span>
            <span className="font-medium">
              {completedCount} / {totalCount}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Section List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sections.map((section, index) => {
            const isActive = section.id === activeSectionId;
            const isCompleted = section.status === "completed";
            const icon = SECTION_ICONS[section.type || "text"];

            return (
              <button
                key={section.id}
                onClick={() => onSelectSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  "hover:bg-accent",
                  isActive && "bg-primary/10 text-primary font-medium",
                  !isActive && isCompleted && "text-muted-foreground",
                )}
              >
                {/* Status indicator */}
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border",
                    isCompleted
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isActive
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/30",
                  )}
                >
                  {isCompleted ? (
                    <IconCheck className="size-3.5" />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{section.title}</span>
                    {section.visibility?.audience === "internal" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0"
                      >
                        Intern
                      </Badge>
                    )}
                  </div>
                  {section.hint && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {section.hint}
                    </p>
                  )}
                </div>

                {/* Type icon */}
                <div className="shrink-0 text-muted-foreground">{icon}</div>
              </button>
            );
          })}

          {sections.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Inga sektioner i denna rapport
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick actions */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {completedCount === totalCount && totalCount > 0
              ? "Alla sektioner klara!"
              : `${totalCount - completedCount} kvar`}
          </span>
          {progressPercent === 100 && (
            <Badge variant="default" className="bg-emerald-500">
              Redo för export
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default SectionNav;
