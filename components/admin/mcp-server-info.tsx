"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
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

export function McpServerInfoCard() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopierat till urklipp!");
  };

  const mcpUrl =
    typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "";

  return (
    <Card className="bg-[#111111] border-white/10">
      <CardHeader>
        <CardTitle className="text-white">MCP Server</CardTitle>
        <CardDescription className="text-gray-300">
          Konfiguration för MCP-server som används av AI-assistenter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white">MCP Server URL</Label>
          <div className="flex gap-2">
            <Input
              value={mcpUrl}
              readOnly
              className="font-mono text-sm bg-white/5 text-white border-white/20"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => mcpUrl && copyToClipboard(mcpUrl)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-400">
          <p className="font-medium text-gray-200">
            Instruktioner för Vapi-integration
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Gå till din VAPI-assistent i VAPI Dashboard</li>
            <li>Navigera till "Model" → "Tools" → "MCP Servers"</li>
            <li>Klicka på "Add MCP Server"</li>
            <li>Klistra in MCP Server URL ovan</li>
            <li>Under "Authentication", välj "Bearer Token"</li>
            <li>Klistra in din API-nyckel från admin/API-nycklar</li>
            <li>Spara och testa anslutningen</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
