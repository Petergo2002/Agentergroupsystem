"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan_type: string;
  subscription_status: string;
  monthly_price: number;
  contact_email: string;
  timezone: string;
  max_users: number;
  max_contacts: number;
  max_properties: number;
  max_storage_gb: number;
}

interface OrganizationSettingsProps {
  organization: Organization;
}

export function OrganizationSettings({
  organization,
}: OrganizationSettingsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: organization.name,
    contact_email: organization.contact_email,
    plan_type: organization.plan_type,
    subscription_status: organization.subscription_status,
    monthly_price: organization.monthly_price.toString(),
    max_users: organization.max_users.toString(),
    max_contacts: organization.max_contacts.toString(),
    max_properties: organization.max_properties.toString(),
    max_storage_gb: organization.max_storage_gb.toString(),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/organizations/${organization.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update organization");
      }

      toast.success("Organization updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update organization");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation.toLowerCase() !== "delete") {
      toast.error('Skriv "delete" för att bekräfta');
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/organizations/${organization.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete organization");
      }

      toast.success("Organization raderad");
      router.push("/admin/organizations");
    } catch (error) {
      toast.error("Kunde inte radera organization");
      console.error(error);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update organization details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) =>
                  setFormData({ ...formData, contact_email: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription & Billing</CardTitle>
          <CardDescription>Manage plan and pricing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="plan_type">Plan Type</Label>
              <Select
                value={formData.plan_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, plan_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription_status">Status</Label>
              <Select
                value={formData.subscription_status}
                onValueChange={(value) =>
                  setFormData({ ...formData, subscription_status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_price">Monthly Price ($)</Label>
              <Input
                id="monthly_price"
                type="number"
                step="0.01"
                value={formData.monthly_price}
                onChange={(e) =>
                  setFormData({ ...formData, monthly_price: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Limits</CardTitle>
          <CardDescription>
            Configure resource limits for this organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="max_users">Max Users</Label>
              <Input
                id="max_users"
                type="number"
                value={formData.max_users}
                onChange={(e) =>
                  setFormData({ ...formData, max_users: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_contacts">Max Contacts</Label>
              <Input
                id="max_contacts"
                type="number"
                value={formData.max_contacts}
                onChange={(e) =>
                  setFormData({ ...formData, max_contacts: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_properties">Max Properties</Label>
              <Input
                id="max_properties"
                type="number"
                value={formData.max_properties}
                onChange={(e) =>
                  setFormData({ ...formData, max_properties: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_storage_gb">Max Storage (GB)</Label>
              <Input
                id="max_storage_gb"
                type="number"
                value={formData.max_storage_gb}
                onChange={(e) =>
                  setFormData({ ...formData, max_storage_gb: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-500/50 bg-red-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-500">Farozon</CardTitle>
          </div>
          <CardDescription>
            Permanent radering av organization. Denna åtgärd kan inte ångras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Radera Organization
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 border-red-500/50">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Är du helt säker?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Detta kommer permanent radera{" "}
                  <strong className="text-white">{organization.name}</strong>{" "}
                  och all tillhörande data inklusive användare, kontakter,
                  fastigheter och affärer.
                  <br />
                  <br />
                  <strong className="text-red-400">
                    Denna åtgärd kan inte ångras!
                  </strong>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm" className="text-white">
                    Skriv{" "}
                    <code className="px-2 py-1 bg-gray-800 rounded text-red-400">
                      delete
                    </code>{" "}
                    för att bekräfta
                  </Label>
                  <Input
                    id="delete-confirm"
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
                  onClick={() => setDeleteConfirmation("")}
                >
                  Avbryt
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={
                    deleting || deleteConfirmation.toLowerCase() !== "delete"
                  }
                  className="gap-2"
                >
                  {deleting ? (
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
        </CardContent>
      </Card>
    </div>
  );
}
