"use client";

import {
  AlertTriangle,
  MoreVertical,
  Shield,
  ShieldOff,
  Trash2,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  name: string;
  email: string;
  is_super_admin: boolean;
}

interface UserManagementActionsProps {
  user: User;
  currentUserId: string;
}

export function UserManagementActions({
  user,
  currentUserId,
}: UserManagementActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const isCurrentUser = user.id === currentUserId;

  const toggleSuperAdmin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_super_admin: !user.is_super_admin }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      toast.success(
        user.is_super_admin
          ? "Super admin-rättigheter borttagna"
          : "Super admin-rättigheter tillagda",
      );
      router.refresh();
    } catch (error) {
      toast.error("Kunde inte uppdatera användare");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async () => {
    if (deleteConfirmation.toLowerCase() !== "delete") {
      toast.error('Skriv "delete" för att bekräfta');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast.success("Användare raderad");
      setShowDeleteDialog(false);
      router.refresh();
    } catch (error) {
      toast.error("Kunde inte radera användare");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-gray-900 border-gray-700"
        >
          <DropdownMenuLabel className="text-gray-300">
            Åtgärder
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700" />

          {!isCurrentUser && (
            <>
              <DropdownMenuItem
                onClick={toggleSuperAdmin}
                disabled={loading}
                className="text-gray-300 hover:bg-gray-800 cursor-pointer"
              >
                {user.is_super_admin ? (
                  <>
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Ta bort Super Admin
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Gör till Super Admin
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-700" />

              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
                className="text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Radera Användare
              </DropdownMenuItem>
            </>
          )}

          {isCurrentUser && (
            <DropdownMenuItem disabled className="text-gray-500">
              Du kan inte ändra din egen användare
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 border-red-500/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Radera användare?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Detta kommer permanent radera{" "}
              <strong className="text-white">{user.name}</strong> ({user.email}
              ).
              <br />
              <br />
              <strong className="text-red-400">
                Denna åtgärd kan inte ångras!
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-user-confirm" className="text-white">
                Skriv{" "}
                <code className="px-2 py-1 bg-gray-800 rounded text-red-400">
                  delete
                </code>{" "}
                för att bekräfta
              </Label>
              <Input
                id="delete-user-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="delete"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              onClick={() => {
                setDeleteConfirmation("");
                setShowDeleteDialog(false);
              }}
            >
              Avbryt
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={deleteUser}
              disabled={
                loading || deleteConfirmation.toLowerCase() !== "delete"
              }
              className="gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Raderar...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Radera Permanent
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
