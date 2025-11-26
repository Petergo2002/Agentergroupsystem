"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  CheckSquare,
  Clock,
  Mail,
  Phone,
  Plus,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QuickActionsProps {
  onAddEvent: () => void;
  onAddContact: () => void;
  onAddTask: () => void;
  onScheduleCall?: () => void;
  onSendEmail?: () => void;
  onStartMeeting?: () => void;
}

export function QuickActions({
  onAddEvent,
  onAddContact,
  onAddTask,
  onScheduleCall,
  onSendEmail,
  onStartMeeting,
}: QuickActionsProps) {
  const primaryActions = [
    {
      title: "Ny händelse",
      description: "Schemalägg ett möte",
      icon: Calendar,
      onClick: onAddEvent,
      color: "bg-blue-500 hover:bg-blue-600",
      shortcut: "Cmd+E",
    },
    {
      title: "Lägg till kontakt",
      description: "Ny person i CRM",
      icon: Users,
      onClick: onAddContact,
      color: "bg-green-500 hover:bg-green-600",
      shortcut: "Cmd+N",
    },
    {
      title: "Skapa uppgift",
      description: "Ny att-göra",
      icon: CheckSquare,
      onClick: onAddTask,
      color: "bg-purple-500 hover:bg-purple-600",
      shortcut: "Cmd+T",
    },
  ];

  const secondaryActions = [
    {
      title: "Boka samtal",
      icon: Phone,
      onClick: onScheduleCall,
      color: "bg-emerald-500 hover:bg-emerald-600",
    },
    {
      title: "Skicka e-post",
      icon: Mail,
      onClick: onSendEmail,
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
    {
      title: "Starta möte",
      icon: Video,
      onClick: onStartMeeting,
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Snabbåtgärder</span>
          </CardTitle>
          <CardDescription>
            Vanliga åtgärder för att hålla dig produktiv
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {primaryActions.map((action, index) => {
              const Icon = action.icon;

              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    onClick={action.onClick}
                    className={`w-full h-auto p-4 ${action.color} text-white flex flex-col items-center space-y-2 group`}
                    variant="default"
                  >
                    <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs opacity-90">
                        {action.description}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {action.shortcut}
                      </div>
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Secondary Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Kommunikation</span>
          </CardTitle>
          <CardDescription>Snabba kommunikationsåtgärder</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {secondaryActions.map((action, index) => {
              const Icon = action.icon;

              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Button
                    onClick={action.onClick}
                    variant="outline"
                    className={`w-full h-16 ${action.color} border-0 text-white hover:scale-105 transition-all duration-200`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {action.title}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
