import {
  Activity,
  Building2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { OrganizationsByPlan } from "@/components/admin/organizations-by-plan";
import { RecentOrganizations } from "@/components/admin/recent-organizations";
import { RevenueChart } from "@/components/admin/revenue-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export default async function AdminDashboard() {
  const supabase = await createServerClient();

  // Check if user is super admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("id, is_super_admin")
    .eq("id", user.id)
    .single();

  if (!currentUser?.is_super_admin) {
    redirect("/");
  }

  // Use service client to bypass RLS for super admins
  const serviceClient = createServiceClient();

  // Fetch statistics
  const { count: totalOrgs } = await serviceClient
    .from("organizations")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  const { count: activeOrgs } = await serviceClient
    .from("organizations")
    .select("*", { count: "exact", head: true })
    .eq("subscription_status", "active")
    .is("deleted_at", null);

  const { count: totalUsers } = await serviceClient
    .from("users")
    .select("*", { count: "exact", head: true });

  // Calculate MRR (Monthly Recurring Revenue)
  const { data: organizations } = await serviceClient
    .from("organizations")
    .select("monthly_price")
    .eq("subscription_status", "active")
    .is("deleted_at", null);

  const mrr =
    organizations?.reduce(
      (sum, org) => sum + (Number(org.monthly_price) || 0),
      0,
    ) || 0;

  // Get recent activity count
  const { count: recentActivity } = await serviceClient
    .from("activity_log")
    .select("*", { count: "exact", head: true })
    .gte(
      "created_at",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    );

  const stats = [
    {
      title: "Total Customers",
      value: totalOrgs || 0,
      description: `${activeOrgs || 0} active subscriptions`,
      icon: Building2,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Total Users",
      value: totalUsers || 0,
      description: "Across all customers",
      icon: Users,
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Monthly Revenue",
      value: `$${mrr.toLocaleString()}`,
      description: "MRR from active subscriptions",
      icon: DollarSign,
      trend: "+23%",
      trendUp: true,
    },
    {
      title: "Activity (24h)",
      value: recentActivity || 0,
      description: "Actions in the last 24 hours",
      icon: Activity,
      trend: "-5%",
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-400 mt-1">
          Manage your customers, subscriptions, and platform analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="bg-[#111111] border-white/10 hover:bg-white/5 transition-colors"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-400">{stat.description}</p>
                <div
                  className={`flex items-center text-xs ${stat.trendUp ? "text-green-400" : "text-red-400"}`}
                >
                  {stat.trendUp ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.trend}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-[#111111] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Revenue Overview</CardTitle>
            <CardDescription className="text-gray-400">
              Monthly recurring revenue over time
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart />
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-[#111111] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Customers by Plan</CardTitle>
            <CardDescription className="text-gray-400">
              Distribution of subscription plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationsByPlan />
          </CardContent>
        </Card>
      </div>

      {/* Recent Customers */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Recent Customers</CardTitle>
          <CardDescription className="text-gray-400">
            Latest customers that joined the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentOrganizations />
        </CardContent>
      </Card>
    </div>
  );
}
