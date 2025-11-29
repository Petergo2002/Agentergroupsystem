"use client";

import { Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface User {
  id: string;
  name: string;
  email: string;
  is_super_admin: boolean;
}

interface SuperAdminManagerProps {
  users: User[];
}

export function SuperAdminManager({ users }: SuperAdminManagerProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const toggleSuperAdmin = async (userId: string, currentStatus: boolean) => {
    setUpdating(userId);

    try {
      const response = await fetch("/api/admin/users/super-admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          isSuperAdmin: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update super admin status");
      }

      toast.success(
        !currentStatus
          ? "Super admin access granted"
          : "Super admin access revoked",
      );

      router.refresh();
    } catch (error) {
      toast.error("Failed to update super admin status");
      console.error(error);
    } finally {
      setUpdating(null);
    }
  };

  const superAdmins = users.filter((u) => u.is_super_admin);
  const regularUsers = users.filter((u) => !u.is_super_admin);

  return (
    <div className="space-y-6">
      {/* Current Super Admins */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-medium text-white">
            Super Admins ({superAdmins.length})
          </h3>
        </div>
        <div className="space-y-2">
          {superAdmins.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                    {user.name?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  <Shield className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              </div>
              <Switch
                checked={true}
                onCheckedChange={() => toggleSuperAdmin(user.id, true)}
                disabled={updating === user.id}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Regular Users */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldOff className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-white">
            Regular Users ({regularUsers.length})
          </h3>
        </div>
        <div className="space-y-2">
          {regularUsers.map((user) => (
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
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  Grant super admin access
                </span>
                <Switch
                  checked={false}
                  onCheckedChange={() => toggleSuperAdmin(user.id, false)}
                  disabled={updating === user.id}
                />
              </div>
            </div>
          ))}
          {regularUsers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              All users are super admins
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">About Super Admin Access</p>
            <p className="text-blue-300/80">
              Super admins have full access to the admin dashboard and can
              manage all organizations, users, and settings. Regular users can
              only access their own organization's data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
