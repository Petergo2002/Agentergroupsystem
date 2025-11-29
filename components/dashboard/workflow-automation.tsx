"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckSquare,
  Clock,
  Mail,
  Phone,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: "active" | "inactive";
  lastRun?: Date;
  timesRun: number;
}

interface WorkflowAutomationProps {
  workflows: WorkflowRule[];
  onToggleWorkflow: (id: string) => void;
  onCreateWorkflow: () => void;
}

export function WorkflowAutomation({
  workflows,
  onToggleWorkflow,
  onCreateWorkflow,
}: WorkflowAutomationProps) {
  const suggestedWorkflows = [
    {
      name: "Uppföljning efter möte",
      trigger: "När ett möte slutar",
      action: "Skapa uppföljningsuppgift",
      icon: Calendar,
      color: "bg-blue-100 text-blue-700",
    },
    {
      name: "Kontakt utan telefon",
      trigger: "När ny kontakt läggs till",
      action: "Påminn om att lägga till telefonnummer",
      icon: Phone,
      color: "bg-green-100 text-green-700",
    },
    {
      name: "Veckosammanfattning",
      trigger: "Varje fredag kl 17:00",
      action: "Skicka e-post med veckorapport",
      icon: Mail,
      color: "bg-purple-100 text-purple-700",
    },
    {
      name: "Försenade uppgifter",
      trigger: "När uppgift passerar deadline",
      action: "Skapa påminnelse med hög prioritet",
      icon: CheckSquare,
      color: "bg-red-100 text-red-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Active Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Aktiva arbetsflöden</span>
          </CardTitle>
          <CardDescription>
            Automatiserade processer som sparar tid och förbättrar konsistens
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Inga aktiva arbetsflöden</p>
              <Button onClick={onCreateWorkflow} className="mt-4">
                Skapa ditt första arbetsflöde
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow, index) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{workflow.name}</h4>
                      <Badge
                        variant={
                          workflow.status === "active" ? "default" : "secondary"
                        }
                      >
                        {workflow.status === "active" ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <span>{workflow.trigger}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{workflow.action}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Körts {workflow.timesRun} gånger</span>
                      {workflow.lastRun && (
                        <span>
                          Senast: {workflow.lastRun.toLocaleDateString("sv-SE")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleWorkflow(workflow.id)}
                  >
                    {workflow.status === "active" ? "Pausa" : "Aktivera"}
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Föreslagna arbetsflöden</span>
          </CardTitle>
          <CardDescription>
            Populära automationer som kan förbättra din produktivitet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedWorkflows.map((workflow, index) => {
              const Icon = workflow.icon;

              return (
                <motion.div
                  key={workflow.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={onCreateWorkflow}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${workflow.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">
                        {workflow.name}
                      </h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Trigger:</span>
                          <span>{workflow.trigger}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ArrowRight className="h-3 w-3" />
                          <span>{workflow.action}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Automation Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Automationsstatistik</CardTitle>
          <CardDescription>
            Hur mycket tid dina arbetsflöden sparar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">2.5h</div>
              <div className="text-sm text-gray-600">
                Sparad tid denna vecka
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">47</div>
              <div className="text-sm text-gray-600">Automatiska åtgärder</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">95%</div>
              <div className="text-sm text-gray-600">Framgångsfrekvens</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
