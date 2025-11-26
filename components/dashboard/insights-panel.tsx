"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  Lightbulb,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Insight {
  id: string;
  type: "success" | "warning" | "info" | "tip";
  title: string;
  description: string;
  action?: string;
  priority: "high" | "medium" | "low";
}

interface InsightsPanelProps {
  insights: Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case "success":
        return TrendingUp;
      case "warning":
        return AlertTriangle;
      case "tip":
        return Lightbulb;
      default:
        return Star;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "tip":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-purple-50 border-purple-200 text-purple-800";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="destructive" className="text-xs">
            Hög
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="secondary" className="text-xs">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="text-xs">
            Låg
          </Badge>
        );
      default:
        return null;
    }
  };

  const sortedInsights = insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (
      priorityOrder[b.priority as keyof typeof priorityOrder] -
      priorityOrder[a.priority as keyof typeof priorityOrder]
    );
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Smarta insikter</span>
        </CardTitle>
        <CardDescription>
          AI-drivna rekommendationer för att förbättra din produktivitet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {sortedInsights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Inga insikter tillgängliga</p>
            <p className="text-xs mt-1">
              Använd systemet mer för personliga rekommendationer
            </p>
          </div>
        ) : (
          sortedInsights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type);

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-l-4 ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                  </div>
                  {getPriorityBadge(insight.priority)}
                </div>

                <p className="text-sm mb-2 opacity-90">{insight.description}</p>

                {insight.action && (
                  <div className="text-xs font-medium opacity-75">
                    💡 {insight.action}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to generate insights based on data
export function generateInsights(data: {
  events: any[];
  contacts: any[];
  tasks: any[];
}): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // Check for busy periods
  const todayEvents = data.events.filter((event) => {
    const eventDate = new Date(event.start_time);
    return eventDate.toDateString() === now.toDateString();
  });

  if (todayEvents.length > 5) {
    insights.push({
      id: "busy-day",
      type: "warning",
      title: "Intensiv dag",
      description: `Du har ${todayEvents.length} händelser idag. Överväg att lägga till pausen mellan möten.`,
      action: "Lägg till 15-minuters buffertar mellan möten",
      priority: "high",
    });
  }

  // Check for contacts without complete info
  const incompleteContacts = data.contacts.filter(
    (contact) => !contact.phone || !contact.email,
  );
  if (incompleteContacts.length > 0) {
    insights.push({
      id: "incomplete-contacts",
      type: "tip",
      title: "Komplettera kontaktuppgifter",
      description: `${incompleteContacts.length} kontakter saknar telefonnummer eller e-post.`,
      action: "Uppdatera kontaktinformation för bättre kommunikation",
      priority: "medium",
    });
  }

  // Check for overdue tasks
  const overdueTasks = data.tasks.filter((task) => {
    if (!task.due_date || task.status === "done") return false;
    return new Date(task.due_date) < now;
  });

  if (overdueTasks.length > 0) {
    insights.push({
      id: "overdue-tasks",
      type: "warning",
      title: "Försenade uppgifter",
      description: `${overdueTasks.length} uppgifter har passerat sina deadlines.`,
      action: "Prioritera och slutför försenade uppgifter",
      priority: "high",
    });
  }

  // Productivity insights
  const completedTasks = data.tasks.filter((task) => task.status === "done");
  if (completedTasks.length > 10) {
    insights.push({
      id: "productive-streak",
      type: "success",
      title: "Produktiv period!",
      description: `Du har slutfört ${completedTasks.length} uppgifter. Bra jobbat!`,
      priority: "low",
    });
  }

  // Network growth
  const recentContacts = data.contacts.filter((contact) => {
    const contactDate = new Date(contact.created_at);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return contactDate > weekAgo;
  });

  if (recentContacts.length > 3) {
    insights.push({
      id: "network-growth",
      type: "success",
      title: "Växande nätverk",
      description: `Du har lagt till ${recentContacts.length} nya kontakter denna vecka.`,
      action: "Överväg att schemalägga uppföljningssamtal",
      priority: "medium",
    });
  }

  // Empty calendar warning
  const upcomingEvents = data.events.filter((event) => {
    const eventDate = new Date(event.start_time);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate > tomorrow && eventDate < nextWeek;
  });

  if (upcomingEvents.length === 0) {
    insights.push({
      id: "empty-calendar",
      type: "tip",
      title: "Tomt schema nästa vecka",
      description: "Du har inga schemalagda möten nästa vecka.",
      action: "Planera proaktiva möten eller fokustid",
      priority: "low",
    });
  }

  return insights;
}
