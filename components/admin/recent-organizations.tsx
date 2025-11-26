"use client";

import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan_type: string;
  subscription_status: string;
  created_at: string;
}

export function RecentOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/organizations")
      .then((res) => res.json())
      .then((data) => {
        // Handle both array and object responses
        const orgs = Array.isArray(data) ? data : [];
        setOrganizations(orgs.slice(0, 5));
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching organizations:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">No organizations yet</div>
    );
  }

  return (
    <div className="space-y-3">
      {organizations.map((org) => (
        <div
          key={org.id}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {org.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white">{org.name}</p>
              <p className="text-xs text-gray-400">{org.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="capitalize border-white/20 text-gray-300"
            >
              {org.plan_type}
            </Badge>
            <p className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(org.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
