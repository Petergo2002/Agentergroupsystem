"use client";

import {
  Calendar,
  DollarSign,
  Eye,
  Filter,
  MoreHorizontal,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CampaignAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock campaign analytics data
  const campaignMetrics = {
    totalCampaigns: 12,
    activeCampaigns: 4,
    totalReach: 15420,
    avgConversionRate: 14.2,
    totalRevenue: 89500,
    revenueGrowth: 23.5,
    topPerformingCampaign: "Q4 Product Launch",
  };

  const campaigns = [
    {
      id: 1,
      name: "Q4 Product Launch",
      status: "active",
      reach: 5240,
      conversions: 742,
      conversionRate: 14.2,
      revenue: 37200,
      cost: 8500,
      roi: 337.6,
      startDate: "2024-01-15",
      endDate: "2024-03-15",
    },
    {
      id: 2,
      name: "Holiday Promotion",
      status: "completed",
      reach: 3890,
      conversions: 623,
      conversionRate: 16.0,
      revenue: 28900,
      cost: 6200,
      roi: 366.1,
      startDate: "2023-12-01",
      endDate: "2023-12-31",
    },
    {
      id: 3,
      name: "Spring Newsletter",
      status: "active",
      reach: 2150,
      conversions: 258,
      conversionRate: 12.0,
      revenue: 12400,
      cost: 3200,
      roi: 287.5,
      startDate: "2024-03-01",
      endDate: "2024-04-30",
    },
    {
      id: 4,
      name: "Summer Sale",
      status: "active",
      reach: 4140,
      conversions: 497,
      conversionRate: 12.0,
      revenue: 21000,
      cost: 5100,
      roi: 311.8,
      startDate: "2024-06-01",
      endDate: "2024-08-31",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Campaign Analytics
          </h2>
          <p className="text-gray-600 mt-1">
            Track performance across all your marketing campaigns
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Campaigns
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignMetrics.totalCampaigns}
            </div>
            <p className="text-xs text-muted-foreground">
              {campaignMetrics.activeCampaigns} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignMetrics.totalReach.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              people reached this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Conversion
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignMetrics.avgConversionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${campaignMetrics.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              <span className="text-green-600">
                +{campaignMetrics.revenueGrowth}% growth
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  Performance trends chart
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Best performer: {campaignMetrics.topPerformingCampaign}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ROI by Campaign</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  ROI comparison chart
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Average ROI:{" "}
                  {campaigns.reduce((sum, c) => sum + c.roi, 0) /
                    campaigns.length}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Campaign
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    Reach
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    Conversions
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    Conv. Rate
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    Revenue
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    ROI
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {campaign.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                          {new Date(campaign.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}
                      >
                        {campaign.status.charAt(0).toUpperCase() +
                          campaign.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {campaign.reach.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {campaign.conversions.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {campaign.conversionRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      ${campaign.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-medium text-green-600">
                        {campaign.roi}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
