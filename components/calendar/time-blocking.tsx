"use client";

import { motion } from "framer-motion";
import { Book, Briefcase, Clock, Coffee, Focus, Zap } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TimeBlock {
  id: string;
  title: string;
  type: "focus" | "meeting" | "break" | "admin" | "learning";
  duration: number; // minutes
  color: string;
  icon: any;
}

interface TimeBlockingProps {
  onCreateBlock: (block: Omit<TimeBlock, "id">) => void;
}

export function TimeBlocking({ onCreateBlock }: TimeBlockingProps) {
  const [selectedType, setSelectedType] = useState<TimeBlock["type"]>("focus");

  const blockTypes: Record<
    TimeBlock["type"],
    {
      label: string;
      color: string;
      bgColor: string;
      icon: any;
      description: string;
      suggestedDuration: number[];
    }
  > = {
    focus: {
      label: "Fokusarbete",
      color: "text-blue-700",
      bgColor: "bg-blue-100",
      icon: Focus,
      description: "Djupt koncentrerat arbete utan avbrott",
      suggestedDuration: [25, 45, 90, 120],
    },
    meeting: {
      label: "Möten",
      color: "text-green-700",
      bgColor: "bg-green-100",
      icon: Briefcase,
      description: "Schemalagda möten och samtal",
      suggestedDuration: [15, 30, 60, 90],
    },
    break: {
      label: "Paus",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
      icon: Coffee,
      description: "Vila och återhämtning",
      suggestedDuration: [5, 15, 30, 60],
    },
    admin: {
      label: "Administration",
      color: "text-purple-700",
      bgColor: "bg-purple-100",
      icon: Clock,
      description: "E-post, planering och administrativa uppgifter",
      suggestedDuration: [15, 30, 45, 60],
    },
    learning: {
      label: "Lärande",
      color: "text-indigo-700",
      bgColor: "bg-indigo-100",
      icon: Book,
      description: "Utbildning och kompetensutveckling",
      suggestedDuration: [30, 60, 90, 120],
    },
  };

  const handleCreateBlock = (duration: number) => {
    const blockType = blockTypes[selectedType];
    onCreateBlock({
      title: `${blockType.label} - ${duration} min`,
      type: selectedType,
      duration,
      color: blockType.bgColor,
      icon: blockType.icon,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Tidsblockering</span>
        </CardTitle>
        <CardDescription>
          Skapa fokuserade tidsblock för optimal produktivitet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Block Type Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Välj typ av tidsblock</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(blockTypes).map(([type, config], index) => {
              const Icon = config.icon;
              const isSelected = selectedType === type;

              return (
                <motion.button
                  key={type}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedType(type as TimeBlock["type"])}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? `${config.bgColor} ${config.color} border-current`
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{config.label}</span>
                  </div>
                  <p className="text-xs opacity-75">{config.description}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Välj varaktighet för {blockTypes[selectedType].label.toLowerCase()}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {blockTypes[selectedType].suggestedDuration.map(
              (duration, index) => (
                <motion.div
                  key={duration}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Button
                    onClick={() => handleCreateBlock(duration)}
                    variant="outline"
                    className="w-full h-16 flex flex-col items-center justify-center space-y-1 hover:scale-105 transition-transform"
                  >
                    <span className="text-lg font-bold">{duration}</span>
                    <span className="text-xs">minuter</span>
                  </Button>
                </motion.div>
              ),
            )}
          </div>
        </div>

        {/* Productivity Tips */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            💡 Produktivitetstips
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Använd Pomodoro-tekniken: 25 min fokus + 5 min paus</li>
            <li>• Blockera liknande uppgifter tillsammans</li>
            <li>• Schemalägg krävande arbete när du är som mest alert</li>
            <li>• Lämna buffertar mellan möten för reflektion</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
