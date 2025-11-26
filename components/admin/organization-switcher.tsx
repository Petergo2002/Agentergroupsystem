"use client";

import {
  Building2,
  ChevronsUpDown,
  ExternalLink,
  Search,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export function OrganizationSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/organizations")
      .then((res) => res.json())
      .then((data) => {
        const orgs = Array.isArray(data) ? data : [];
        setOrganizations(orgs);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching organizations:", error);
        setLoading(false);
      });
  }, []);

  const handleViewDashboard = (org: Organization) => {
    setSelectedOrg(org);
    setOpen(false);
    setSearchTerm("");
    // Store organization context and navigate to dashboard
    sessionStorage.setItem("admin_viewing_org", org.id);
    router.push(`/?org=${org.id}`);
  };

  const handleViewDetails = (org: Organization) => {
    setOpen(false);
    setSearchTerm("");
    // Navigate to organization admin detail page
    router.push(`/admin/organizations/${org.id}`);
  };

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-sm">
              {selectedOrg ? selectedOrg.name : "View organization..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[240px] bg-[#111111] border-white/10"
        align="start"
      >
        <DropdownMenuLabel className="text-gray-400">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus-visible:ring-1"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <ScrollArea className="max-h-[300px]">
          {filteredOrgs.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-400">
              No organizations found
            </div>
          ) : (
            filteredOrgs.map((org) => (
              <DropdownMenuSub key={org.id}>
                <DropdownMenuSubTrigger className="cursor-pointer text-gray-300 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white">
                  <div className="flex flex-col">
                    <span className="font-medium">{org.name}</span>
                    <span className="text-xs text-gray-500">{org.slug}</span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-[#111111] border-white/10">
                  <DropdownMenuItem
                    onClick={() => handleViewDashboard(org)}
                    className="cursor-pointer text-gray-300 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleViewDetails(org)}
                    className="cursor-pointer text-gray-300 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
