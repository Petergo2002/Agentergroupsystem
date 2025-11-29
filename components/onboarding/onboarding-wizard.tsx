"use client";

import {
  Building2,
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageSquare,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  /** User's name for personalized greeting */
  userName?: string;
  /** Callback when onboarding is completed */
  onComplete: () => void;
  /** Callback when user skips onboarding */
  onSkip?: () => void;
}

type Step = "welcome" | "org-details" | "first-action" | "complete";

const STEPS: Step[] = ["welcome", "org-details", "first-action", "complete"];

export function OnboardingWizard({
  userName,
  onComplete,
  onSkip,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      const nextStep = STEPS[nextIndex];
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      // Mark first login as complete
      await fetch("/api/auth/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_first_login: false }),
      });
      onSkip?.();
      onComplete();
    } catch (error) {
      toast.error("Kunde inte hoppa över introduktionen");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Mark first login as complete
      await fetch("/api/auth/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_first_login: false }),
      });
      toast.success("Välkommen! Du är redo att börja.");
      onComplete();
    } catch (error) {
      toast.error("Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  const handleFirstAction = (action: "contacts" | "reports" | "ai") => {
    // Mark as complete and navigate
    handleComplete().then(() => {
      switch (action) {
        case "contacts":
          router.push("/customers");
          break;
        case "reports":
          router.push("/rapport");
          break;
        case "ai":
          router.push("/ai-assistants");
          break;
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <Progress value={progress} className="h-1 mb-4" />
        </CardHeader>

        <CardContent className="pt-0">
          {/* Step: Welcome */}
          {currentStep === "welcome" && (
            <div className="text-center space-y-6">
              <div>
                <CardTitle className="text-2xl mb-2">
                  Välkommen{userName ? `, ${userName}` : ""}!
                </CardTitle>
                <CardDescription className="text-base">
                  Låt oss hjälpa dig komma igång med din nya arbetsyta.
                  Det tar bara en minut.
                </CardDescription>
              </div>

              <div className="space-y-3">
                <Button onClick={handleNext} className="w-full" size="lg">
                  Kom igång
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="w-full"
                  disabled={loading}
                >
                  Hoppa över för nu
                </Button>
              </div>
            </div>
          )}

          {/* Step: Organization Details */}
          {currentStep === "org-details" && (
            <div className="space-y-6">
              <div className="text-center">
                <CardTitle className="text-xl mb-2">
                  Berätta om ditt företag
                </CardTitle>
                <CardDescription>
                  Detta hjälper oss anpassa upplevelsen för dig.
                </CardDescription>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Företagsnamn</Label>
                  <Input
                    id="org-name"
                    placeholder="T.ex. Anderssons Bygg AB"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                  disabled={loading}
                >
                  Hoppa över
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Fortsätt
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step: First Action */}
          {currentStep === "first-action" && (
            <div className="space-y-6">
              <div className="text-center">
                <CardTitle className="text-xl mb-2">
                  Vad vill du göra först?
                </CardTitle>
                <CardDescription>
                  Välj en åtgärd för att komma igång, eller hoppa över för att
                  utforska på egen hand.
                </CardDescription>
              </div>

              <div className="space-y-3">
                <ActionCard
                  icon={Users}
                  title="Lägg till en kontakt"
                  description="Börja bygga din kunddatabas"
                  onClick={() => handleFirstAction("contacts")}
                />
                <ActionCard
                  icon={FileText}
                  title="Skapa en rapportmall"
                  description="Designa professionella rapporter"
                  onClick={() => handleFirstAction("reports")}
                />
                <ActionCard
                  icon={MessageSquare}
                  title="Utforska AI-assistenter"
                  description="Se hur AI kan hjälpa dig"
                  onClick={() => handleFirstAction("ai")}
                />
              </div>

              <Button
                variant="ghost"
                onClick={handleComplete}
                className="w-full"
                disabled={loading}
              >
                Utforska på egen hand
              </Button>
            </div>
          )}

          {/* Step: Complete */}
          {currentStep === "complete" && (
            <div className="text-center space-y-6">
              <div className="mx-auto p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">Du är redo!</CardTitle>
                <CardDescription className="text-base">
                  Din arbetsyta är konfigurerad. Börja utforska alla funktioner.
                </CardDescription>
              </div>
              <Button
                onClick={handleComplete}
                className="w-full"
                size="lg"
                disabled={loading}
              >
                Gå till dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-lg border",
        "hover:bg-muted/50 hover:border-primary/50 transition-colors",
        "text-left"
      )}
    >
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}
