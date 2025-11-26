"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AnalyticsData {
  todayEvents: number;
  totalContacts: number;
  pendingTasks: number;
  weekEvents: number;
  completedTasksThisWeek: number;
  newContactsThisWeek: number;
  averageEventsPerDay: number;
  contactsWithPhone: number;
  contactsWithEmail: number;
  upcomingDeadlines: number;
}

interface AnalyticsCardsProps {
  data: AnalyticsData;
}

export function AnalyticsCards({ data }: AnalyticsCardsProps) {
  const cards = [
    {
      title: "Dagens aktivitet",
      value: data.todayEvents,
      description: "schemalagda händelser",
      icon: Calendar,
      trend: data.averageEventsPerDay > 0 ? "up" : "neutral",
      trendValue: `${data.averageEventsPerDay.toFixed(1)} snitt/dag`,
      color: "blue",
    },
    {
      title: "Kontaktnätverk",
      value: data.totalContacts,
      description: "totala kontakter",
      icon: Users,
      trend: data.newContactsThisWeek > 0 ? "up" : "neutral",
      trendValue: `+${data.newContactsThisWeek} denna vecka`,
      color: "green",
    },
    {
      title: "Produktivitet",
      value: data.completedTasksThisWeek,
      description: "slutförda uppgifter",
      icon: Target,
      trend: data.pendingTasks < 5 ? "up" : "down",
      trendValue: `${data.pendingTasks} väntande`,
      color: "purple",
    },
    {
      title: "Kommande vecka",
      value: data.weekEvents,
      description: "planerade möten",
      icon: Clock,
      trend: data.weekEvents > data.todayEvents ? "up" : "down",
      trendValue: `${data.upcomingDeadlines} deadlines`,
      color: "orange",
    },
  ];

  const contactQuality = [
    {
      title: "Telefonnummer",
      value: data.contactsWithPhone,
      total: data.totalContacts,
      icon: Phone,
      color: "blue",
    },
    {
      title: "E-postadresser",
      value: data.contactsWithEmail,
      total: data.totalContacts,
      icon: Mail,
      color: "green",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      green: "bg-green-50 text-green-700 border-green-200",
      purple: "bg-purple-50 text-purple-700 border-purple-200",
      orange: "bg-orange-50 text-orange-700 border-orange-200",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trend === "up" ? TrendingUp : TrendingDown;

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`hover:shadow-lg transition-all duration-300 border-l-4 ${getColorClasses(card.color)}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    {card.trend !== "neutral" && (
                      <TrendIcon
                        className={`h-3 w-3 ${card.trend === "up" ? "text-green-500" : "text-red-500"}`}
                      />
                    )}
                    <span>{card.trendValue}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Contact Quality Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contactQuality.map((item, index) => {
          const Icon = item.icon;
          const percentage =
            item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Kontaktkvalitet
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {item.title}
                      </span>
                      <span className="text-sm font-medium">
                        {item.value}/{item.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${item.color === "blue" ? "bg-blue-500" : "bg-green-500"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {percentage}% av kontakter har {item.title.toLowerCase()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
