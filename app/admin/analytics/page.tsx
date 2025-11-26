import { Activity, BarChart3, TrendingUp, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Analytics
        </h1>
        <p className="text-gray-400 mt-1">Advanced analytics and insights</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-[#111111] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Growth Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">+23%</div>
            <p className="text-xs text-gray-400 mt-1">vs last month</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">3</div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Avg Session
            </CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">12m</div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Conversion
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">80%</div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Advanced Analytics</CardTitle>
          <CardDescription className="text-gray-400">
            Detailed insights and reporting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Analytics Dashboard
            </h3>
            <p className="text-gray-400">
              Advanced analytics and reporting features will be available here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
