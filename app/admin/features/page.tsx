import { Code, Flag, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FeaturesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Feature Flags
        </h1>
        <p className="text-gray-400 mt-1">
          Global feature flag management across all organizations
        </p>
      </div>

      {/* Coming Soon */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">
            Global Feature Management
          </CardTitle>
          <CardDescription className="text-gray-400">
            Manage feature flags across all organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Flag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Feature Flag Dashboard
            </h3>
            <p className="text-gray-400 mb-4">
              Global feature flag management will be available here
            </p>
            <p className="text-sm text-gray-500">
              For now, manage feature flags per organization in the
              Organizations section
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
