import { Vapi } from "@/lib/analytics/vapi";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AssistantIdentifierOptions = {
  identifier?: string | null;
  apiKey?: string | null;
  baseUrl?: string | null;
  orgId?: string | null;
};

export type AssistantIdentifiers = {
  shortId: string | null;
  uuid: string | null;
};

export function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_REGEX.test(value.trim());
}

function collectCandidates(record: Record<string, any>): string[] {
  const keys = [
    "id",
    "assistantId",
    "assistant_id",
    "uuid",
    "assistantUuid",
    "assistant_uuid",
    "slug",
    "short_id",
    "shortId",
  ];
  const values = new Set<string>();
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" && value.trim().length) {
      values.add(value.trim());
    }
  }
  return Array.from(values);
}

function extractUuid(record: Record<string, any>): string | null {
  const values = collectCandidates(record);
  return values.find((value) => UUID_REGEX.test(value)) ?? null;
}

function extractShortId(record: Record<string, any>): string | null {
  const values = collectCandidates(record);
  return values.find((value) => !UUID_REGEX.test(value)) ?? null;
}

export async function resolveVapiAssistantIdentifiers(
  options: AssistantIdentifierOptions,
): Promise<AssistantIdentifiers> {
  const identifier = options.identifier?.trim();
  if (!identifier) {
    return { shortId: null, uuid: null };
  }

  if (isUuid(identifier)) {
    return { shortId: identifier, uuid: identifier };
  }

  if (!options.apiKey) {
    throw new Error("Vapi API key is required to resolve assistant UUIDs");
  }

  const vapi = new Vapi({
    apiKey: options.apiKey,
    baseUrl: options.baseUrl || "https://api.vapi.ai",
    orgId: options.orgId || undefined,
  });

  const assistants = await vapi.getAssistants();
  const match = assistants.find((assistant: any) =>
    collectCandidates(assistant).some(
      (value) => value.toLowerCase() === identifier.toLowerCase(),
    ),
  );

  if (!match) {
    throw new Error("Assistant could not be found in the linked Vapi account");
  }

  const uuid = extractUuid(match);
  if (!uuid) {
    throw new Error("Resolved assistant record did not expose a UUID");
  }

  const shortId = extractShortId(match) ?? identifier;
  return { shortId, uuid };
}
