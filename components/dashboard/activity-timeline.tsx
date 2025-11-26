"use client";

import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckSquare,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ActivityItem {
  id: string;
  type: "event" | "contact" | "task" | "call" | "email";
  title: string;
  description?: string;
  timestamp: Date;
  status?: "completed" | "pending" | "in-progress";
  contactName?: string;
  priority?: "high" | "medium" | "low";
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "event":
        return Calendar;
      case "contact":
        return Users;
      case "task":
        return CheckSquare;
      case "call":
        return Phone;
      case "email":
        return Mail;
      default:
        return MessageSquare;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    if (status === "completed")
      return "bg-green-100 text-green-700 border-green-200";

    switch (type) {
      case "event":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "contact":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "task":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "call":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "email":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusBadge = (status?: string, priority?: string) => {
    if (status === "completed") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Slutförd
        </Badge>
      );
    }
    if (status === "in-progress") {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          Pågår
        </Badge>
      );
    }
    if (priority === "high") {
      return <Badge variant="destructive">Hög prioritet</Badge>;
    }
    if (priority === "medium") {
      return <Badge variant="secondary">Medium</Badge>;
    }
    return null;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "event":
        return "Händelse";
      case "contact":
        return "Kontakt";
      case "task":
        return "Uppgift";
      case "call":
        return "Samtal";
      case "email":
        return "E-post";
      default:
        return "Aktivitet";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Senaste aktiviteter</span>
        </CardTitle>
        <CardDescription>
          Dina senaste interaktioner och händelser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Inga aktiviteter att visa</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`p-2 rounded-full border ${getActivityColor(activity.type, activity.status)}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {getTypeLabel(activity.type)}
                      </span>
                    </div>
                    {getStatusBadge(activity.status, activity.priority)}
                  </div>

                  {activity.description && (
                    <p className="text-sm text-gray-600 mb-1 line-clamp-2">
                      {activity.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span>
                        {formatDistanceToNow(activity.timestamp, {
                          addSuffix: true,
                          locale: sv,
                        })}
                      </span>
                      {activity.contactName && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">
                            {activity.contactName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
