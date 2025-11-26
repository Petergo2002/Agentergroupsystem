import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Embed",
  description: "Embedded widgets",
};

/**
 * Root layout for all /embed/* routes.
 * This layout does NOT include AuthProvider, so embedded widgets
 * can be loaded on external sites without triggering auth redirects.
 */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return a minimal HTML shell without AuthProvider
  // Child layouts (e.g. /embed/widget/layout.tsx) can further customize
  return (
    <html lang="sv" style={{ background: "transparent" }}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* Hide all Next.js dev tools in embeds */
          [data-nextjs-dialog-overlay],
          [data-nextjs-dialog],
          nextjs-portal,
          #__next-build-indicator,
          #__next-build-watcher,
          [data-next-mark],
          [data-nextjs-scroll],
          body > nextjs-portal,
          body > [style*="position: fixed"][style*="z-index: 99999"],
          body > div[style*="position: fixed"][style*="bottom: 10px"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "transparent",
          overflow: "hidden",
          width: "100%",
          height: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
