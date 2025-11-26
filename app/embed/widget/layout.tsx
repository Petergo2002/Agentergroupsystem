import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat Widget",
  description: "AI Chat Widget",
};

/**
 * Nested layout for /embed/widget routes.
 * Parent layout (app/embed/layout.tsx) already provides <html> and <body>,
 * so we just wrap children here without duplicating those tags.
 */
export default function EmbedWidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
