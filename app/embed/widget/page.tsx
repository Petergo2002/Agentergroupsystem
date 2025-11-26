import { ChatWidgetFrame } from "@/components/widget/chat-widget-frame";
import { VoiceWidgetFrame } from "@/components/widget/voice-widget-frame";
import { createServiceClient } from "@/lib/supabase/service";

type WidgetPageProps = {
  searchParams?: {
    publicId?: string;
  };
};

export default async function EmbedWidgetPage({
  searchParams,
}: WidgetPageProps) {
  const publicId = searchParams?.publicId;

  if (!publicId) {
    return <WidgetError message="Widget-ID saknas" />;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("chat_widget_configs")
    .select(
      "public_id, logo_url, primary_color, text_color, position, welcome_message, placeholder_text, button_text, vapi_agent_id, enabled, widget_mode",
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load widget config for iframe", error);
    return <WidgetError message="Kunde inte ladda widgeten" />;
  }

  if (!data || !data.enabled) {
    return <WidgetError message="Widgeten är inaktiverad" />;
  }

  const widgetMode = data.widget_mode || "chat";

  return (
    <div className="h-full w-full bg-transparent">
      {widgetMode === "voice" ? (
        <VoiceWidgetFrame
          publicId={data.public_id}
          logoUrl={data.logo_url}
          primaryColor={data.primary_color}
          vapiAgentId={data.vapi_agent_id}
        />
      ) : (
        <ChatWidgetFrame
          publicId={data.public_id}
          logoUrl={data.logo_url}
          primaryColor={data.primary_color}
          welcomeMessage={data.welcome_message}
          textColor={data.text_color}
          placeholderText={data.placeholder_text}
          buttonText={data.button_text}
          vapiAgentId={data.vapi_agent_id}
        />
      )}
    </div>
  );
}

function WidgetError({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white/70 text-sm text-slate-500">
      {message}
    </div>
  );
}
