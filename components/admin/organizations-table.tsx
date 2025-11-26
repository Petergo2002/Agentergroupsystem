"use client";

import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Settings, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan_type: string;
  subscription_status: string;
  monthly_price: number;
  created_at: string;
  owner?: { name: string; email: string };
  organization_members?: { count: number }[];
}

interface OrganizationsTableProps {
  organizations: Organization[];
}

const planColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-800",
  starter: "bg-blue-100 text-blue-800",
  professional: "bg-purple-100 text-purple-800",
  enterprise: "bg-orange-100 text-orange-800",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  trial: "bg-yellow-100 text-yellow-800",
  past_due: "bg-red-100 text-red-800",
  canceled: "bg-gray-100 text-gray-800",
  suspended: "bg-red-100 text-red-800",
};

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!orgToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/customers/${orgToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to delete customer");
      }

      toast.success("Customer deleted successfully");
      setDeleteDialogOpen(false);
      setOrgToDelete(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete customer");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-10 w-full max-w-sm rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-[#111111] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-gray-400">Organization</TableHead>
              <TableHead className="text-gray-400">Plan</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Members</TableHead>
              <TableHead className="text-gray-400">MRR</TableHead>
              <TableHead className="text-gray-400">Created</TableHead>
              <TableHead className="text-right text-gray-400">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrgs.length === 0 ? (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-400"
                >
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrgs.map((org) => (
                <TableRow
                  key={org.id}
                  className="border-white/10 hover:bg-white/5 transition-colors"
                >
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{org.name}</div>
                      <div className="text-sm text-gray-400">{org.slug}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={planColors[org.plan_type] || planColors.free}
                    >
                      {org.plan_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        statusColors[org.subscription_status] ||
                        statusColors.active
                      }
                    >
                      {org.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-300">
                      <Users className="h-4 w-4 text-gray-400" />
                      {org.organization_members?.[0]?.count || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    ${org.monthly_price?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-400">
                    {formatDistanceToNow(new Date(org.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-[#111111] border-white/10"
                      >
                        <DropdownMenuLabel className="text-gray-400">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/organizations/${org.id}`)
                          }
                          className="text-gray-300 hover:text-white cursor-pointer"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                          onClick={() => {
                            setOrgToDelete(org.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#111111] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete this organization and all associated
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
