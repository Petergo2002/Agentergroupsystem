"use client";

import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PerformanceAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("overall");

  // Mock performance data
  const performanceMetrics = {
    overallScore: 87.5,
    scoreChange: 5.2,
    efficiency: 92.3,
    efficiencyChange: -1.8,
    productivity: 84.7,
    productivityChange: 8.1,
    customerSatisfaction: 89.2,
    satisfactionChange: 3.4,
    responseTime: 2.3, // hours
    responseTimeChange: -12.5,
    resolutionRate: 94.8,
    resolutionRateChange: 2.1,
  };

  const departmentPerformance = [
    { name: "Sales", score: 91.2, change: 4.5, color: "bg-green-500" },
    { name: "Marketing", score: 88.7, change: 6.2, color: "bg-blue-500" },
    {
      name: "Customer Support",
      score: 85.3,
      change: -2.1,
      color: "bg-yellow-500",
    },
    { name: "Operations", score: 89.8, change: 3.7, color: "bg-purple-500" },
  ];

  const kpiTrends = [
    { metric: "Lead Conversion", current: 14.2, target: 15.0, trend: "up" },
    { metric: "Customer Retention", current: 89.5, target: 90.0, trend: "up" },
    { metric: "Average Deal Size", current: 4250, target: 4500, trend: "down" },
    { metric: "Sales Cycle Length", current: 28, target: 25, trend: "down" },
    {
      metric: "Customer Acquisition Cost",
      current: 125,
      target: 120,
      trend: "up",
    },
    {
      metric: "Monthly Recurring Revenue",
      current: 45600,
      target: 50000,
      trend: "up",
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Performance Analytics
          </h2>
          <p className="text-gray-600 mt-1">
            Monitor key performance indicators and team efficiency
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Performance Score Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Performance
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.overallScore}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              <span className="text-green-600">
                +{performanceMetrics.scoreChange}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Efficiency Score
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.efficiency}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
              <span className="text-red-600">
                {performanceMetrics.efficiencyChange}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.productivity}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              <span className="text-green-600">
                +{performanceMetrics.productivityChange}% from last period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customer Satisfaction
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.customerSatisfaction}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              <span className="text-green-600">
                +{performanceMetrics.satisfactionChange}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.responseTime}h
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="w-3 h-3 mr-1 text-green-500" />
              <span className="text-green-600">
                {Math.abs(performanceMetrics.responseTimeChange)}% faster
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resolution Rate
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.resolutionRate}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              <span className="text-green-600">
                +{performanceMetrics.resolutionRateChange}% from last period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentPerformance.map((dept) => (
                <div
                  key={dept.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${dept.color}`} />
                    <span className="font-medium">{dept.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">{dept.score}%</span>
                    <div className="flex items-center text-xs">
                      {dept.change >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                      <span
                        className={
                          dept.change >= 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {Math.abs(dept.change)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  Performance trends chart
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Overall trend: Improving
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kpiTrends.map((kpi) => (
              <div key={kpi.metric} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{kpi.metric}</h4>
                  {kpi.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Current:</span>
                    <span className="font-medium">
                      {typeof kpi.current === "number" && kpi.current > 1000
                        ? kpi.current.toLocaleString()
                        : kpi.current}
                      {kpi.metric.includes("Rate") ||
                      kpi.metric.includes("Conversion") ||
                      kpi.metric.includes("Retention")
                        ? "%"
                        : ""}
                      {kpi.metric.includes("Cost") ||
                      kpi.metric.includes("Revenue") ||
                      kpi.metric.includes("Size")
                        ? "$"
                        : ""}
                      {kpi.metric.includes("Length") ? " days" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Target:</span>
                    <span>
                      {typeof kpi.target === "number" && kpi.target > 1000
                        ? kpi.target.toLocaleString()
                        : kpi.target}
                      {kpi.metric.includes("Rate") ||
                      kpi.metric.includes("Conversion") ||
                      kpi.metric.includes("Retention")
                        ? "%"
                        : ""}
                      {kpi.metric.includes("Cost") ||
                      kpi.metric.includes("Revenue") ||
                      kpi.metric.includes("Size")
                        ? "$"
                        : ""}
                      {kpi.metric.includes("Length") ? " days" : ""}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        kpi.current >= kpi.target
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                      style={{
                        width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
