import { Shield } from "lucide-react";
import { redirect } from "next/navigation";
import { McpEndpointsTab } from "@/components/admin/mcp-endpoints-tab";
import { McpServerInfoCard } from "@/components/admin/mcp-server-info";
import { SuperAdminManager } from "@/components/admin/super-admin-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export default async function SettingsPage() {
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

  // Use service client to bypass RLS
  const serviceClient = createServiceClient();

  // Get all users
  const { data: users } = await serviceClient
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="text-gray-400 mt-1">
          Configure platform settings and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="admins" className="space-y-4">
        <TabsList className="bg-[#111111] border border-white/10">
          <TabsTrigger
            value="admins"
            className="data-[state=active]:bg-white/10"
          >
            Super Admins
          </TabsTrigger>
          <TabsTrigger
            value="mcp"
            className="data-[state=active]:bg-white/10"
          >
            AI Endpoints
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-white/10"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-white/10"
          >
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="space-y-4">
          <Card className="bg-[#111111] border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Shield className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white">
                    Super Admin Management
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Grant or revoke super admin access to users
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SuperAdminManager users={users || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mcp" className="space-y-4">
          <McpEndpointsTab />
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card className="bg-[#111111] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Platform-wide configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <McpServerInfoCard />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="bg-[#111111] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Authentication and access control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-400">
                  Security settings will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
