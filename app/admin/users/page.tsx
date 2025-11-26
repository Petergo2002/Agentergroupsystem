import { Building2, Shield, Users } from "lucide-react";
import { UserManagementActions } from "@/components/admin/user-management-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export default async function UsersPage() {
  const supabase = await createServerClient();

  // Check if user is super admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return <div>Unauthorized</div>;
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("id, is_super_admin")
    .eq("id", user.id)
    .single();

  if (!currentUser?.is_super_admin) {
    return <div>Forbidden</div>;
  }

  // Use service client to bypass RLS and see all users
  const serviceClient = createServiceClient();

  const { data: users } = await serviceClient
    .from("users")
    .select(`
      *,
      organization:organizations(name, slug)
    `)
    .order("created_at", { ascending: false });

  const { count: totalUsers } = await serviceClient
    .from("users")
    .select("*", { count: "exact", head: true });

  const { count: superAdmins } = await serviceClient
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_super_admin", true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Users</h1>
        <p className="text-gray-400 mt-1">
          Manage all users across organizations
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-[#111111] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {totalUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Super Admins
            </CardTitle>
            <Shield className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {superAdmins || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {users?.filter((u) => u.organization_id).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">All Users</CardTitle>
          <CardDescription className="text-gray-400">
            Complete list of users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users?.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {user.name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user.is_super_admin && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      Super Admin
                    </Badge>
                  )}
                  {user.organization && (
                    <Badge
                      variant="outline"
                      className="border-white/20 text-gray-300"
                    >
                      {user.organization.name}
                    </Badge>
                  )}
                  <UserManagementActions
                    user={user}
                    currentUserId={currentUser.id}
                  />
                </div>
              </div>
            ))}
            {(!users || users.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
