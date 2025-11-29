import { NextResponse } from "next/server";
import { getOrganizationVapiConfig } from "@/lib/server/vapi-org-config";

/**
 * GET /api/user/vapi-web-config
 * Returns public Vapi configuration for web-based voice interactions
 * Only exposes public key and base URL - never the private server key
 */
export async function GET() {
  try {
    const { config, error, organizationId, userId } =
      await getOrganizationVapiConfig();

    console.log("🔍 Vapi Web Config Request:", {
      userId,
      organizationId,
      hasConfig: !!config,
      error,
    });

    // Handle errors from getOrganizationVapiConfig
    if (error) {
      console.log("❌ Error from getOrganizationVapiConfig:", error);

      // Provide specific error messages
      if (error.includes("not authenticated")) {
        return NextResponse.json(
          { error: "Du måste vara inloggad för att använda röstfunktionen" },
          { status: 401 },
        );
      }

      if (error.includes("organization not found")) {
        return NextResponse.json(
          {
            error: "Du tillhör ingen organisation. Kontakta din administratör.",
          },
          { status: 400 },
        );
      }

      if (error.includes("not enabled or configured")) {
        return NextResponse.json(
          {
            error:
              "AI-integration är inte aktiverad för din organisation. Kontakta din administratör.",
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: error || "Failed to load Vapi configuration" },
        { status: 400 },
      );
    }

    if (!config) {
      console.log("❌ No config returned");
      return NextResponse.json(
        { error: "Ingen Vapi-konfiguration hittades" },
        { status: 400 },
      );
    }

    console.log("📋 Config details:", {
      vapi_enabled: config.vapi_enabled,
      hasPrivateKey: !!config.vapi_api_key,
      hasPublicKey: !!config.vapi_public_api_key,
      publicKeyPreview: config.vapi_public_api_key
        ? `${config.vapi_public_api_key.substring(0, 10)}...`
        : null,
    });

    if (!config.vapi_enabled) {
      console.log("❌ Vapi not enabled");
      return NextResponse.json(
        {
          error:
            "AI-integration är inte aktiverad för din organisation. Kontakta din administratör.",
        },
        { status: 400 },
      );
    }

    if (!config.vapi_public_api_key) {
      console.log("❌ No public key configured");
      return NextResponse.json(
        {
          error:
            "Public API-nyckel saknas. Kontakta din administratör för att lägga till den.",
        },
        { status: 400 },
      );
    }

    console.log("✅ Returning public config successfully");

    // Return only public, non-sensitive configuration
    return NextResponse.json({
      publicKey: config.vapi_public_api_key,
      baseUrl: config.vapi_base_url || "https://api.vapi.ai",
      defaultCallAssistantId: config.default_call_assistant_id,
      organizationId,
    });
  } catch (error: any) {
    console.error("❌ Error fetching Vapi web config:", error);
    return NextResponse.json(
      { error: "Ett oväntat fel inträffade. Försök igen senare." },
      { status: 500 },
    );
  }
}
