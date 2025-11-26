"use client";

import { motion } from "framer-motion";
import { Calendar, Target, TrendingUp, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DataVisualizationProps {
  events: any[];
  contacts: any[];
  tasks: any[];
}

export function DataVisualization({
  events,
  contacts,
  tasks,
}: DataVisualizationProps) {
  // Calculate weekly activity data
  const getWeeklyData = () => {
    const days = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
    const weekData = days.map((day, index) => {
      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.start_time);
        return eventDate.getDay() === (index + 1) % 7;
      }).length;

      return {
        day,
        events: dayEvents,
        height: Math.max(dayEvents * 20, 10), // Minimum height of 10px
      };
    });

    const maxEvents = Math.max(...weekData.map((d) => d.events), 1);
    return weekData.map((d) => ({
      ...d,
      percentage: (d.events / maxEvents) * 100,
    }));
  };

  // Calculate contact growth over time
  const getContactGrowth = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun"];
    return months.map((month, index) => {
      const monthContacts = contacts.filter((contact) => {
        const contactDate = new Date(contact.created_at);
        return contactDate.getMonth() === index;
      }).length;

      return {
        month,
        contacts: monthContacts,
        cumulative: contacts.filter((contact) => {
          const contactDate = new Date(contact.created_at);
          return contactDate.getMonth() <= index;
        }).length,
      };
    });
  };

  // Task completion rate
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const pending = total - completed - inProgress;

    return {
      completed: { count: completed, percentage: (completed / total) * 100 },
      inProgress: { count: inProgress, percentage: (inProgress / total) * 100 },
      pending: { count: pending, percentage: (pending / total) * 100 },
    };
  };

  const weeklyData = getWeeklyData();
  const contactGrowth = getContactGrowth();
  const taskStats = getTaskStats();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Veckoaktivitet</span>
          </CardTitle>
          <CardDescription>Händelser per dag denna vecka</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-32 space-x-2">
            {weeklyData.map((data, index) => (
              <motion.div
                key={data.day}
                initial={{ height: 0 }}
                animate={{ height: `${data.percentage}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex flex-col items-center flex-1"
              >
                <div className="w-full bg-blue-500 rounded-t min-h-[4px] flex items-end justify-center">
                  {data.events > 0 && (
                    <span className="text-white text-xs font-medium mb-1">
                      {data.events}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600 mt-2">{data.day}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Completion Donut */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Uppgiftsstatus</span>
          </CardTitle>
          <CardDescription>Fördelning av dina uppgifter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              {/* SVG Donut Chart */}
              <svg
                className="w-32 h-32 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <title>Uppgiftsstatus</title>
                {/* Background circle */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="3"
                />
                {/* Completed tasks */}
                <motion.path
                  initial={{ strokeDasharray: "0 100" }}
                  animate={{
                    strokeDasharray: `${taskStats.completed.percentage} 100`,
                  }}
                  transition={{ duration: 1, delay: 0.2 }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />
                {/* In progress tasks */}
                <motion.path
                  initial={{ strokeDasharray: "0 100" }}
                  animate={{
                    strokeDasharray: `${taskStats.inProgress.percentage} 100`,
                    strokeDashoffset: -taskStats.completed.percentage,
                  }}
                  transition={{ duration: 1, delay: 0.4 }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">{tasks.length}</div>
                  <div className="text-xs text-gray-500">totalt</div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Slutförda</span>
              </div>
              <span className="font-medium">{taskStats.completed.count}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Pågående</span>
              </div>
              <span className="font-medium">{taskStats.inProgress.count}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <span>Väntande</span>
              </div>
              <span className="font-medium">{taskStats.pending.count}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Growth Trend */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Kontakttillväxt</span>
          </CardTitle>
          <CardDescription>Hur ditt nätverk växer över tid</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-24 space-x-4">
            {contactGrowth.map((data, index) => {
              const maxContacts = Math.max(
                ...contactGrowth.map((d) => d.cumulative),
                1,
              );
              const height = (data.cumulative / maxContacts) * 100;

              return (
                <motion.div
                  key={data.month}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${height}%`, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="flex flex-col items-center flex-1"
                >
                  <div className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t min-h-[8px] flex items-start justify-center relative">
                    {data.cumulative > 0 && (
                      <span className="absolute -top-6 text-xs font-medium text-gray-700">
                        {data.cumulative}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 mt-2">
                    {data.month}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Trend indicator */}
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span>
              +{contactGrowth[contactGrowth.length - 1]?.contacts || 0} nya
              kontakter senaste månaden
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
