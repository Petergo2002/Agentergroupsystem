"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateOrganizationDialogProps {
  children: React.ReactNode;
}

export function CreateOrganizationDialog({
  children,
}: CreateOrganizationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    plan_type: "free",
    contact_email: "",
    monthly_price: "0",
    user_first_name: "",
    user_last_name: "",
    user_email: "",
    user_password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error creating customer:", errorData);
        throw new Error(errorData.error || "Failed to create customer");
      }

      const data = await response.json();
      toast.success("Customer and user created successfully");
      setOpen(false);
      setFormData({
        name: "",
        slug: "",
        plan_type: "free",
        contact_email: "",
        monthly_price: "0",
        user_first_name: "",
        user_last_name: "",
        user_email: "",
        user_password: "",
      });

      // Refresh the page to show the new customer
      router.refresh();

      // Force a hard refresh to ensure all components update
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to create organization");
      console.error("Create organization error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild suppressHydrationWarning>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Add a new client organization to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    slug: generateSlug(name),
                  });
                }}
                placeholder="Acme Corporation"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug (URL identifier)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="acme-corporation"
                required
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs: yourapp.com/{formData.slug}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) =>
                  setFormData({ ...formData, contact_email: e.target.value })
                }
                placeholder="admin@acme.com"
                required
              />
            </div>
            <div className="grid gap-2">
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
                  <SelectItem value="starter">Starter - $29/mo</SelectItem>
                  <SelectItem value="professional">
                    Professional - $99/mo
                  </SelectItem>
                  <SelectItem value="enterprise">
                    Enterprise - Custom
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="monthly_price">Monthly Price ($)</Label>
              <Input
                id="monthly_price"
                type="number"
                step="0.01"
                value={formData.monthly_price}
                onChange={(e) =>
                  setFormData({ ...formData, monthly_price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            {/* User Account Section */}
            <div className="col-span-2 pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-white mb-3">
                Owner Account
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Create a user account for the organization owner. They can
                change their password after first login.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user_first_name">First Name</Label>
              <Input
                id="user_first_name"
                value={formData.user_first_name}
                onChange={(e) =>
                  setFormData({ ...formData, user_first_name: e.target.value })
                }
                placeholder="John"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user_last_name">Last Name</Label>
              <Input
                id="user_last_name"
                value={formData.user_last_name}
                onChange={(e) =>
                  setFormData({ ...formData, user_last_name: e.target.value })
                }
                placeholder="Doe"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user_email">User Email</Label>
              <Input
                id="user_email"
                type="email"
                value={formData.user_email}
                onChange={(e) =>
                  setFormData({ ...formData, user_email: e.target.value })
                }
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user_password">Temporary Password</Label>
              <Input
                id="user_password"
                type="password"
                value={formData.user_password}
                onChange={(e) =>
                  setFormData({ ...formData, user_password: e.target.value })
                }
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-400">
                User will be prompted to change this on first login
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
