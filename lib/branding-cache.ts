export const BRANDING_CACHE_KEY = "app-branding-cache";
export const BRANDING_EVENT = "branding-cache:update";

export type BrandingCachePayload = {
  name: string | null;
  logoUrl: string | null;
};

function normalizeValue(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function readBrandingCache(): BrandingCachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BRANDING_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      name: normalizeValue(parsed?.name) ?? null,
      logoUrl: normalizeValue(parsed?.logoUrl) ?? null,
    };
  } catch {
    return null;
  }
}

export function writeBrandingCache(payload: BrandingCachePayload) {
  if (typeof window === "undefined") return;
  const normalized: BrandingCachePayload = {
    name: normalizeValue(payload.name),
    logoUrl: normalizeValue(payload.logoUrl),
  };

  try {
    window.localStorage.setItem(
      BRANDING_CACHE_KEY,
      JSON.stringify({ ...normalized, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // Ignore write errors (e.g., private mode)
  }

  try {
    window.dispatchEvent(
      new CustomEvent<BrandingCachePayload>(BRANDING_EVENT, {
        detail: normalized,
      }),
    );
  } catch {
    // Ignore dispatch errors
  }
}
