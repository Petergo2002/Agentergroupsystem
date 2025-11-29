"use client";

import {
  Bot,
  Code2,
  Copy,
  Eye,
  Globe,
  Image as ImageIcon,
  Save,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Assistant {
  id: string;
  name: string;
}

interface WidgetConfig {
  organization_id?: string;
  public_id?: string;
  assistant_id: string;
  primary_color: string;
  text_color: string;
  position: "bottom-right" | "bottom-left";
  welcome_message: string;
  placeholder_text: string;
  button_text: string;
  logo_url?: string | null;
  widget_mode?: "chat" | "voice";
}

export default function ChatWidgetSettingsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [config, setConfig] = useState<WidgetConfig>({
    assistant_id: "",
    primary_color: "#3b82f6",
    text_color: "#ffffff",
    position: "bottom-right",
    welcome_message: "Hej! Hur kan jag hjälpa dig idag?",
    placeholder_text: "Skriv ditt meddelande...",
    button_text: "Chatta med oss",
    logo_url: null,
    widget_mode: "chat",
  });

  const [embedCode, setEmbedCode] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  // Listen for postMessage from the widget iframe to sync open/close state
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our own origin
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (data && typeof data === "object" && data.type === "ag-widget:state") {
        setPreviewOpen(Boolean(data.open));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load assistants
      const assistantsRes = await fetch("/api/user/assistants");
      const assistantsData = await assistantsRes.json();
      setAssistants(assistantsData.assistants || []);

      // Load existing widget config
      const configRes = await fetch("/api/user/widget-config");
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.config) {
          setConfig(configData.config);
          generateEmbedCode(configData.config);
        }
      }
    } catch (_err: unknown) {
      toast.error("Kunde inte ladda data");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config.assistant_id) {
      toast.error("Välj en assistent först");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/user/widget-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Kunde inte spara konfiguration",
        );
      }

      toast.success("Widget-konfiguration sparad! 🎉");

      // Reload to get the public_id
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ett fel uppstod";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const generateEmbedCode = (cfg: WidgetConfig) => {
    if (!cfg.public_id) {
      setEmbedCode("");
      return;
    }

    const baseUrl = "https://calendar-crm-six.vercel.app";
    const position = cfg.position === "bottom-left" ? "left" : "right";
    const widgetType = cfg.widget_mode === "voice" ? "Voice" : "Chat";

    const code = `<!-- AI ${widgetType} Widget -->
<iframe 
  src="${baseUrl}/embed/widget?publicId=${cfg.public_id}"
  style="position:fixed;bottom:24px;${position}:24px;width:80px;height:80px;border:0;border-radius:50%;z-index:2147483646;box-shadow:0 8px 24px rgba(15,23,42,0.2);"
  allow="microphone; autoplay; clipboard-write"
  title="AI ${widgetType} Widget"
  id="ag-widget-${cfg.public_id}"
></iframe>
<script>
window.addEventListener('message',function(e){
  var f=document.getElementById('ag-widget-${cfg.public_id}');
  if(!f||e.data?.type!=='ag-widget:state')return;
  if(e.data.open){f.style.width='380px';f.style.height='560px';f.style.borderRadius='24px';f.style.boxShadow='0 25px 60px rgba(15,23,42,0.35)';}
  else{f.style.width='80px';f.style.height='80px';f.style.borderRadius='50%';f.style.boxShadow='0 8px 24px rgba(15,23,42,0.2)';}
});
</script>`;

    setEmbedCode(code);
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed-kod kopierad! 📋");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Ogiltig filtyp. Använd JPEG, PNG, GIF, WebP eller SVG");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Filen är för stor. Max 5MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/user/widget-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Kunde inte ladda upp logotyp");
      }

      const data = await response.json();
      setConfig({ ...config, logo_url: data.logoUrl });
      toast.success("Logotyp uppladdad! 🎉");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ett fel uppstod";
      toast.error(message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setConfig({ ...config, logo_url: null });
    toast.success("Logotyp borttagen");
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Chat Widget</h1>
        <p className="text-muted-foreground mt-2">
          Anpassa och bädda in din AI-chatbot på din hemsida
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Inställningar</TabsTrigger>
          <TabsTrigger value="preview">Förhandsvisning</TabsTrigger>
          <TabsTrigger value="embed">Embed-kod</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grundinställningar</CardTitle>
              <CardDescription>
                Välj vilken AI-assistent som ska användas i widgeten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>AI-Assistent</Label>
                <Select
                  value={config.assistant_id}
                  onValueChange={(value) =>
                    setConfig({ ...config, assistant_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj en assistent" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={config.position}
                  onValueChange={(value: "bottom-right" | "bottom-left") =>
                    setConfig({ ...config, position: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">
                      Nere till höger
                    </SelectItem>
                    <SelectItem value="bottom-left">
                      Nere till vänster
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Design</CardTitle>
              <CardDescription>
                Anpassa utseende och typ av widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Widget-typ</Label>
                <Select
                  value={config.widget_mode || "chat"}
                  onValueChange={(value: "chat" | "voice") =>
                    setConfig({ ...config, widget_mode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat">💬 Chat-widget (text)</SelectItem>
                    <SelectItem value="voice">
                      📞 Voice-widget (röst)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {config.widget_mode === "voice"
                    ? "Användare kan ringa och prata med assistenten via röst"
                    : "Användare kan chatta med assistenten via text"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Logotyp</Label>
                {config.logo_url ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={config.logo_url}
                      alt="Widget logo"
                      className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Logotyp uppladdad
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeLogo}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Ta bort
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Ladda upp din logotyp (max 5MB)
                    </p>
                    <label htmlFor="logo-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingLogo}
                        onClick={() =>
                          document.getElementById("logo-upload")?.click()
                        }
                      >
                        {uploadingLogo ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            Laddar upp...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Välj fil
                          </>
                        )}
                      </Button>
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primärfärg</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.primary_color}
                      onChange={(e) =>
                        setConfig({ ...config, primary_color: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={config.primary_color}
                      onChange={(e) =>
                        setConfig({ ...config, primary_color: e.target.value })
                      }
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Textfärg</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.text_color}
                      onChange={(e) =>
                        setConfig({ ...config, text_color: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={config.text_color}
                      onChange={(e) =>
                        setConfig({ ...config, text_color: e.target.value })
                      }
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Texter</CardTitle>
              <CardDescription>
                Anpassa meddelanden och texter i widgeten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Knapptext</Label>
                <Input
                  value={config.button_text}
                  onChange={(e) =>
                    setConfig({ ...config, button_text: e.target.value })
                  }
                  placeholder="Chatta med oss"
                />
              </div>

              <div className="space-y-2">
                <Label>Välkomstmeddelande</Label>
                <Textarea
                  value={config.welcome_message}
                  onChange={(e) =>
                    setConfig({ ...config, welcome_message: e.target.value })
                  }
                  placeholder="Hej! Hur kan jag hjälpa dig idag?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Placeholder-text</Label>
                <Input
                  value={config.placeholder_text}
                  onChange={(e) =>
                    setConfig({ ...config, placeholder_text: e.target.value })
                  }
                  placeholder="Skriv ditt meddelande..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              onClick={saveConfig}
              disabled={saving || !config.assistant_id}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sparar...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Spara konfiguration
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => generateEmbedCode(config)}>
              <Eye className="w-4 h-4 mr-2" />
              Förhandsgranska
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live-förhandsvisning
              </CardTitle>
              <CardDescription>
                Detta är en riktig, fungerande widget. Klicka på bubblan och
                chatta med din AI-assistent!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config.public_id ? (
                <div
                  className="relative bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100 rounded-xl min-h-[700px] border border-slate-200"
                  style={{ overflow: "visible" }}
                >
                  {/* Simulated website content */}
                  <div className="p-8 space-y-6">
                    <div className="max-w-2xl">
                      <div className="h-8 bg-slate-300/50 rounded-lg w-3/4 mb-4"></div>
                      <div className="h-4 bg-slate-200/50 rounded w-full mb-2"></div>
                      <div className="h-4 bg-slate-200/50 rounded w-5/6 mb-2"></div>
                      <div className="h-4 bg-slate-200/50 rounded w-4/6"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 max-w-2xl">
                      <div className="h-24 bg-slate-200/50 rounded-lg"></div>
                      <div className="h-24 bg-slate-200/50 rounded-lg"></div>
                      <div className="h-24 bg-slate-200/50 rounded-lg"></div>
                    </div>
                    <div className="max-w-2xl">
                      <div className="h-4 bg-slate-200/50 rounded w-full mb-2"></div>
                      <div className="h-4 bg-slate-200/50 rounded w-5/6 mb-2"></div>
                      <div className="h-4 bg-slate-200/50 rounded w-3/4"></div>
                    </div>
                  </div>

                  {/* Real widget iframe */}
                  <div
                    className={`absolute ${config.position === "bottom-right" ? "right-4" : "left-4"} bottom-4`}
                    style={{
                      zIndex: 9999,
                      width: previewOpen ? "380px" : "80px",
                      height: previewOpen ? "580px" : "80px",
                    }}
                  >
                    <iframe
                      key={config.public_id}
                      src={`/embed/widget?publicId=${config.public_id}`}
                      title="Chat Widget Preview"
                      allow="microphone; autoplay; clipboard-write"
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        borderRadius: previewOpen ? "24px" : "50%",
                        boxShadow: previewOpen
                          ? "0 25px 60px rgba(15,23,42,0.35)"
                          : "0 8px 24px rgba(15,23,42,0.2)",
                        transition: "all 250ms cubic-bezier(0.4,0,0.2,1)",
                        background: "transparent",
                      }}
                    />
                  </div>

                  {/* Info badge */}
                  <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Live widget
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Ingen widget konfigurerad
                  </h3>
                  <p className="text-sm mb-4">
                    Spara din konfiguration först för att se en
                    live-förhandsvisning
                  </p>
                  <Button
                    onClick={() =>
                      document
                        .querySelector('[value="settings"]')
                        ?.dispatchEvent(new Event("click", { bubbles: true }))
                    }
                  >
                    Gå till inställningar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {config.public_id && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Tips för testning</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>
                      Klicka på den runda bubblan för att öppna chatten
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>
                      Skriv ett meddelande och tryck Enter eller klicka på
                      skicka-knappen
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>
                      AI-assistenten svarar i realtid – precis som på din
                      hemsida
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">ℹ</span>
                    <span>
                      Ändringar i inställningarna kräver att du sparar och
                      laddar om sidan
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="embed" className="space-y-6">
          {!embedCode ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="w-12 h-12 text-primary/20 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">
                  Ingen kod genererad än
                </h3>
                <p className="text-slate-500 max-w-sm mt-2 mb-6">
                  Spara dina inställningar i fliken "Inställningar" för att
                  generera din unika widget-kod.
                </p>
                <Button
                  onClick={() =>
                    (
                      document.querySelector(
                        '[value="settings"]',
                      ) as HTMLElement
                    )?.click()
                  }
                >
                  Gå till inställningar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Vänster meny för metoder */}
              <Card className="lg:col-span-3 border-0 shadow-none bg-transparent">
                <Tabs defaultValue="html" className="w-full">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">
                        Integrera Widget
                      </h2>
                      <p className="text-slate-500">
                        Välj hur du vill lägga till widgeten på din sida
                      </p>
                    </div>
                  </div>

                  <TabsList className="grid w-full grid-cols-3 lg:w-[600px] h-auto p-1">
                    <TabsTrigger value="html" className="py-3">
                      <Code2 className="w-4 h-4 mr-2" />
                      HTML / Kod
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="py-3">
                      <Bot className="w-4 h-4 mr-2" />
                      AI Agent
                    </TabsTrigger>
                    <TabsTrigger value="wp" className="py-3">
                      <Globe className="w-4 h-4 mr-2" />
                      WordPress/CMS
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6">
                    {/* HTML / Standard */}
                    <TabsContent value="html" className="space-y-6">
                      <Card>
                        <CardHeader className="border-b pb-4">
                          <CardTitle className="text-lg flex items-center">
                            <Code2 className="w-5 h-5 mr-2 text-primary" />
                            Direkt integration
                          </CardTitle>
                          <CardDescription>
                            Den enklaste metoden. Fungerar på 99% av alla
                            hemsidor.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-medium">
                                Kopiera koden
                              </Label>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                Rekommenderas
                              </span>
                            </div>
                            <div className="relative group">
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-lg opacity-20 blur group-hover:opacity-30 transition duration-200"></div>
                              <div className="relative bg-zinc-950 rounded-lg border border-white/10 shadow-2xl">
                                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5 rounded-t-lg">
                                  <div className="flex space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                  </div>
                                  <span className="text-xs font-mono text-muted-foreground">
                                    index.html
                                  </span>
                                </div>
                                <pre className="p-4 overflow-x-auto text-sm font-mono text-blue-100 leading-relaxed selection:bg-primary/30">
                                  <code>{embedCode}</code>
                                </pre>
                                <div className="absolute top-12 right-4">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                                    onClick={copyEmbedCode}
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Kopiera
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="bg-muted/50 p-4 rounded-lg border border-border">
                              <h4 className="font-medium mb-2 flex items-center text-sm">
                                <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">
                                  1
                                </span>
                                Instruktioner
                              </h4>
                              <p className="text-sm text-muted-foreground ml-7">
                                Klistra in koden ovan precis innan{" "}
                                <code className="bg-muted px-1 py-0.5 rounded text-foreground">
                                  &lt;/body&gt;
                                </code>
                                -taggen på din hemsida.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* AI Agents */}
                    <TabsContent value="ai" className="space-y-6">
                      <Card>
                        <CardHeader className="border-b pb-4">
                          <CardTitle className="text-lg flex items-center">
                            <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                            För AI-verktyg
                          </CardTitle>
                          <CardDescription>
                            Använd denna prompt i Lovable, Bolt, Cursor eller
                            Windsurf.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                              <Label className="text-base font-medium">
                                Prompt att kopiera
                              </Label>
                              <div className="bg-muted/50 p-4 rounded-lg border border-border text-sm font-mono text-muted-foreground leading-relaxed whitespace-pre-line h-[300px] overflow-y-auto">
                                {`Bädda in denna chat-widget på min hemsida.

VIKTIGT - Följ dessa instruktioner EXAKT:
1) Kopiera HELA koden nedan och klistra in den precis före </body>
2) Ändra INGENTING i koden - den är färdig att användas
3) Skapa INGA egna komponenter, iframes eller widgets - använd bara koden jag ger dig

Här är den färdiga widget-koden:

${embedCode}`}
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => {
                                  const prompt = `Bädda in denna chat-widget på min hemsida.\n\nVIKTIGT - Följ dessa instruktioner EXAKT:\n1) Kopiera HELA koden nedan och klistra in den precis före </body>\n2) Ändra INGENTING i koden - den är färdig att användas\n3) Skapa INGA egna komponenter, iframes eller widgets - använd bara koden jag ger dig\n\nHär är den färdiga widget-koden:\n\n${embedCode}`;
                                  navigator.clipboard.writeText(prompt);
                                  toast.success("Prompt kopierad! ✨");
                                }}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Kopiera Prompt
                              </Button>
                            </div>
                            <div className="bg-purple-500/10 p-6 rounded-xl border border-purple-500/20 flex flex-col justify-center items-center text-center space-y-4">
                              <div className="w-16 h-16 bg-background rounded-full shadow-sm flex items-center justify-center mb-2">
                                <Bot className="w-8 h-8 text-purple-500" />
                              </div>
                              <h3 className="font-medium">Så här gör du</h3>
                              <p className="text-sm text-muted-foreground max-w-xs">
                                1. Klicka på "Kopiera Prompt" till vänster
                                <br />
                                2. Gå till ditt AI-verktyg (Lovable, etc.)
                                <br />
                                3. Klistra in prompten i chatten
                                <br />
                                4. AI:n kommer att implementera widgeten korrekt
                                direkt!
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* WordPress / CMS */}
                    <TabsContent value="wp" className="space-y-6">
                      <Card>
                        <CardHeader className="border-b pb-4">
                          <CardTitle className="text-lg flex items-center">
                            <Globe className="w-5 h-5 mr-2 text-primary" />
                            WordPress & CMS
                          </CardTitle>
                          <CardDescription>
                            Fungerar med Elementor, Divi, Wix, Squarespace, etc.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="space-y-6">
                            <div className="bg-muted/30 border border-border rounded-lg overflow-hidden">
                              <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center font-medium text-sm">
                                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-2 text-xs font-bold text-primary">
                                  1
                                </span>
                                Kopiera koden
                              </div>
                              <div className="p-4 flex items-center gap-4">
                                <div className="flex-1 font-mono text-xs text-muted-foreground bg-background p-2 rounded border border-border truncate">
                                  {embedCode.substring(0, 60)}...
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={copyEmbedCode}
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Kopiera
                                </Button>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-card">
                                <h4 className="font-medium mb-2">WordPress</h4>
                                <p className="text-xs text-muted-foreground">
                                  Använd blocket "Custom HTML" och klistra in
                                  koden där.
                                </p>
                              </div>
                              <div className="border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-card">
                                <h4 className="font-medium mb-2">
                                  Wix / Squarespace
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Lägg till en "Embed Code" eller "Code Block"
                                  komponent.
                                </p>
                              </div>
                              <div className="border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-card">
                                <h4 className="font-medium mb-2">Shopify</h4>
                                <p className="text-xs text-muted-foreground">
                                  Redigera temat och lägg koden i footer.liquid
                                  innan &lt;/body&gt;.
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
