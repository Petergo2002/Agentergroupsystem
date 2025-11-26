import { formatDistanceToNow } from "date-fns";
import { Building2, Calendar, Users } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { DynamicTabs } from "@/components/admin/dynamic-tabs";
import { FeatureFlagsManager } from "@/components/admin/feature-flags-manager";
import { OrganizationCredentials } from "@/components/admin/organization-credentials";
import { OrganizationMembers } from "@/components/admin/organization-members";
import { OrganizationSettings } from "@/components/admin/organization-settings";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FeatureFlags } from "@/lib/feature-flags/types";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type FeatureFlagsRelation = FeatureFlags | FeatureFlags[] | null | undefined;

function normalizeFeatureFlags(
  flags: FeatureFlagsRelation,
): FeatureFlags | undefined {
  if (!flags) return undefined;
  if (Array.isArray(flags)) {
    return flags[0];
  }
  return flags;
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const identifier = resolvedParams.id;
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier,
    );
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

  const { data: organization, error: organizationError } = await serviceClient
    .from("organizations")
    .select(`
      *,
      owner:users!organizations_owner_id_fkey(name, email),
      feature_flags:feature_flags!feature_flags_organization_id_fkey(*),
      organization_members(
        id,
        role,
        joined_at,
        user:users!organization_members_user_id_fkey(name, email)
      )
    `)
    .is("deleted_at", null)
    .eq(isUuid ? "id" : "slug", identifier)
    .maybeSingle();

  if (organizationError) {
    console.error("Failed to load organization", {
      identifier,
      isUuid,
      organizationError,
      errorMessage: organizationError.message,
      errorCode: organizationError.code,
      errorDetails: organizationError.details,
    });
    throw new Error(
      `Kunde inte hämta organisationen: ${organizationError.message || "Unknown error"}`,
    );
  }

  if (!organization) {
    notFound();
  }

  const organizationId = organization.id;

  // Get usage stats
  const { count: contactsCount } = await serviceClient
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const { count: propertiesCount } = await serviceClient
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const { count: eventsCount } = await serviceClient
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const stats = [
    {
      title: "Total Members",
      value: organization.organization_members?.length || 0,
      icon: Users,
      limit: organization.max_users,
    },
    {
      title: "Contacts",
      value: contactsCount || 0,
      icon: Building2,
      limit: organization.max_contacts,
    },
    {
      title: "Properties",
      value: propertiesCount || 0,
      icon: Building2,
      limit: organization.max_properties,
    },
    {
      title: "Events",
      value: eventsCount || 0,
      icon: Calendar,
      limit: null,
    },
  ];
  const normalizedFeatureFlags = normalizeFeatureFlags(
    organization.feature_flags as FeatureFlagsRelation,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {organization.name}
          </h1>
          <p className="text-gray-400 mt-1">{organization.slug}</p>
        </div>
        <div className="flex gap-2">
          <Badge className="capitalize bg-blue-500/20 text-blue-300 border-blue-500/30">
            {organization.plan_type}
          </Badge>
          <Badge
            variant="outline"
            className="capitalize border-white/20 text-gray-300"
          >
            {organization.subscription_status}
          </Badge>
        </div>
      </div>

      {/* Stats */}
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
              {stat.limit && (
                <p className="text-xs text-gray-400">of {stat.limit} limit</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-400">Contact Email</p>
              <p className="text-sm text-white">
                {organization.contact_email || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Monthly Price</p>
              <p className="text-sm text-white">
                ${organization.monthly_price?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Created</p>
              <p className="text-sm text-white">
                {formatDistanceToNow(new Date(organization.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Timezone</p>
              <p className="text-sm text-white">{organization.timezone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <DynamicTabs defaultValue="credentials" className="space-y-4">
        <TabsList className="bg-[#111111] border border-white/10">
          <TabsTrigger
            value="credentials"
            className="data-[state=active]:bg-white/10"
          >
            Inloggningsuppgifter
          </TabsTrigger>
          <TabsTrigger
            value="features"
            className="data-[state=active]:bg-white/10"
          >
            Feature Flags
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="data-[state=active]:bg-white/10"
          >
            Members
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-white/10"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-4">
          <OrganizationCredentials
            owner={organization.owner}
            organizationName={organization.name}
          />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <FeatureFlagsManager
            organizationId={organizationId}
            featureFlags={normalizedFeatureFlags}
          />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <OrganizationMembers
            organizationId={organizationId}
            members={organization.organization_members || []}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <OrganizationSettings organization={organization} />
        </TabsContent>
      </DynamicTabs>
    </div>
  );
}
