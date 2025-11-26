import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { CreateOrganizationDialog } from "@/components/admin/create-organization-dialog";
import { OrganizationsTable } from "@/components/admin/organizations-table";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export default async function OrganizationsPage() {
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

  const { data: organizations } = await serviceClient
    .from("organizations")
    .select(`
      *,
      owner:users!organizations_owner_id_fkey(name, email),
      organization_members(count),
      feature_flags(*)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Organizations
          </h1>
          <p className="text-gray-400 mt-1">
            Manage all client organizations and their subscriptions
          </p>
        </div>
        <CreateOrganizationDialog>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            New Organization
          </Button>
        </CreateOrganizationDialog>
      </div>

      {/* Organizations Table */}
      <OrganizationsTable organizations={organizations || []} />
    </div>
  );
}
