"use client";

import { formatDistanceToNow } from "date-fns";
import { UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Member {
  id: string;
  role: string;
  joined_at: string;
  user: {
    name: string;
    email: string;
  };
}

interface OrganizationMembersProps {
  organizationId: string;
  members: Member[];
}

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  member: "bg-green-100 text-green-800",
  viewer: "bg-gray-100 text-gray-800",
};

export function OrganizationMembers({
  organizationId,
  members,
}: OrganizationMembersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""} in this
            organization
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    {member.user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={roleColors[member.role] || roleColors.member}>
                  {member.role}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Joined{" "}
                  {formatDistanceToNow(new Date(member.joined_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No members yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
