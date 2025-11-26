import { type ClassValue, clsx } from "clsx";
import { sv } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { twMerge } from "tailwind-merge";

// Default application timezone (Sweden)
export const SWEDEN_TZ = "Europe/Stockholm";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, SWEDEN_TZ, "d MMMM yyyy", { locale: sv });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, SWEDEN_TZ, "HH:mm", { locale: sv });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, SWEDEN_TZ, "d MMMM yyyy 'kl.' HH:mm", {
    locale: sv,
  });
}
