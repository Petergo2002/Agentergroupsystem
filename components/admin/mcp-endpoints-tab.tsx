import { Calendar, Database, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MCP_TOOLS } from "@/lib/mcp/tools";

// Define categories and icons
const CATEGORIES = {
  property: {
    title: "Property Management",
    description: "Tools for searching and retrieving property details",
    icon: Home,
    tools: ["search_properties", "get_property_details"],
  },
  crm: {
    title: "CRM & Leads",
    description: "Tools for managing contacts and leads",
    icon: Database,
    tools: ["create_lead"],
  },
  scheduling: {
    title: "Scheduling",
    description: "Tools for calendar availability and booking",
    icon: Calendar,
    tools: ["check_availability", "book_meeting"],
  },
};

export function McpEndpointsTab() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6">
        {Object.entries(CATEGORIES).map(([key, category]) => (
          <Card key={key} className="bg-[#111111] border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <category.icon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white">{category.title}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {category.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6">
              {category.tools.map((toolName) => {
                const tool = MCP_TOOLS.find((t) => t.name === toolName);
                if (!tool) return null;

                return (
                  <div
                    key={toolName}
                    className="rounded-lg border border-white/5 bg-white/5 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                        >
                          {tool.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <p className="text-sm text-gray-300">
                        {tool.description}
                      </p>

                      {tool.inputSchema?.properties && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Parameters
                          </div>
                          <div className="rounded-md border border-white/5">
                            <Table>
                              <TableHeader>
                                <TableRow className="hover:bg-transparent border-white/5">
                                  <TableHead className="text-gray-400 h-9">
                                    Name
                                  </TableHead>
                                  <TableHead className="text-gray-400 h-9">
                                    Type
                                  </TableHead>
                                  <TableHead className="text-gray-400 h-9">
                                    Required
                                  </TableHead>
                                  <TableHead className="text-gray-400 h-9">
                                    Description
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.entries(
                                  tool.inputSchema.properties,
                                ).map(
                                  ([paramName, paramDetails]: [
                                    string,
                                    any,
                                  ]) => (
                                    <TableRow
                                      key={paramName}
                                      className="hover:bg-white/5 border-white/5"
                                    >
                                      <TableCell className="font-mono text-sm text-blue-300 py-2">
                                        {paramName}
                                      </TableCell>
                                      <TableCell className="text-gray-400 py-2">
                                        {paramDetails.type}
                                        {paramDetails.enum && (
                                          <span className="text-xs text-gray-500 block">
                                            [{paramDetails.enum.join(", ")}]
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="py-2">
                                        {tool.inputSchema.required?.includes(
                                          paramName,
                                        ) ? (
                                          <Badge
                                            variant="secondary"
                                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-0 text-[10px]"
                                          >
                                            Required
                                          </Badge>
                                        ) : (
                                          <span className="text-gray-600 text-xs">
                                            Optional
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-gray-400 text-sm py-2">
                                        {paramDetails.description}
                                      </TableCell>
                                    </TableRow>
                                  ),
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
