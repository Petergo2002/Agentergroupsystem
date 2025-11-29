import type { PdfProfile, Report } from "@/lib/types/rapport";

// ============================================================================
// Types
// ============================================================================

export type PdfDesignId = "standard" | "modern_hero";

export interface PdfDesignRenderer {
  name: string;
  description: string;
  render: (props: PdfDesignProps) => string;
}

export interface PdfDesignProps {
  report: Report;
  sectionsHtml: string;
  metadata: Record<string, string>;
  colors: { primary: string; secondary: string; accent: string };
  profile?: PdfProfile;
}

// ============================================================================
// Helpers
// ============================================================================

function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return new Date().toLocaleDateString("sv-SE");
  try {
    return new Date(dateString).toLocaleDateString("sv-SE");
  } catch {
    return dateString;
  }
}

// ============================================================================
// Design: Standard (Den vi precis skapade)
// ============================================================================

const StandardDesign: PdfDesignRenderer = {
  name: "Standard",
  description: "Klassisk och professionell layout med tydlig struktur.",
  render: ({ report, sectionsHtml, metadata, colors, profile }) => {
    // Check for cover image
    const coverAsset = report.assets.find(
      (a) =>
        a.tags?.includes("cover") || a.label?.toLowerCase().includes("omslag"),
    );

    const coverHtml = coverAsset
      ? `
      <div style="margin-top: 24px;">
        <img src="${coverAsset.url}" alt="Omslagsbild" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px;" />
      </div>
    `
      : "";

    // Branding från profile
    const headerText = profile?.headerText || "RAPPORT";
    const footerText =
      profile?.footerText ||
      `Genererad ${formatDate(new Date().toISOString())}`;
    const showLogo = profile?.displayLogo && profile?.logoUrl;
    const logoUrl = profile?.logoUrl || "";
    const brandColor = profile?.brandColor || colors.primary;
    const accentColor = profile?.accentColor || colors.secondary;

    // Logo HTML
    const logoHtml = showLogo
      ? `
      <img src="${logoUrl}" alt="Logo" style="height: 40px; max-width: 120px; object-fit: contain;" />
    `
      : `
      <div style="width: 48px; height: 48px; background: ${accentColor}; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px;">R</div>
    `;

    return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: white; color: #1f2937; line-height: 1.6; }
    @page { size: A4; margin: 0; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <!-- Header -->
  <header style="background: linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%); color: white; padding: 24px 40px; display: flex; justify-content: space-between; align-items: center;">
    <div style="display: flex; align-items: center; gap: 16px;">
      ${logoHtml}
      <div>
        <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">${escapeHtml(headerText)}</div>
        <div style="font-size: 18px; font-weight: 600;">${escapeHtml(report.type)}</div>
      </div>
    </div>
    <div style="text-align: right; font-size: 13px; opacity: 0.9;">
      <div>${formatDate(report.metadata.scheduledAt)}</div>
    </div>
  </header>

  <!-- Title Section -->
  <div style="padding: 40px; border-bottom: 1px solid #e5e7eb;">
    <h1 style="font-size: 28px; font-weight: 700; color: ${brandColor}; margin-bottom: 8px;">${escapeHtml(report.title)}</h1>
    <p style="color: #64748b; font-size: 15px;">${escapeHtml(metadata.Kund || metadata.client)} • ${escapeHtml(metadata.Adress || metadata.location)}</p>
    ${coverHtml}
  </div>

  <!-- Metadata Grid -->
  <div style="padding: 24px 40px; background: #f8fafc; border-bottom: 1px solid #e5e7eb; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
    ${Object.entries(metadata)
      .map(
        ([key, value]) => `
      <div>
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${key}</div>
        <div style="font-size: 14px; font-weight: 500; color: #1f2937; margin-top: 2px;">${escapeHtml(value) || "-"}</div>
      </div>
    `,
      )
      .join("")}
  </div>

  <!-- Sections -->
  <div style="padding: 40px;">
    <h2 style="font-size: 18px; font-weight: 600; color: ${brandColor}; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">Innehåll</h2>
    ${sectionsHtml}
  </div>

  <!-- Footer -->
  <footer style="background: ${brandColor}; color: white; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-top: auto;">
    <div style="opacity: 0.8;">${escapeHtml(footerText)}</div>
    <div style="opacity: 0.8;">Sida 1</div>
  </footer>
</body>
</html>
    `;
  },
};

// ============================================================================
// Design: Modern Hero (NY!)
// ============================================================================

const ModernHeroDesign: PdfDesignRenderer = {
  name: "Modern Hero",
  description: "Modern design med stor omslagsbild och diagonal layout.",
  render: ({ report, sectionsHtml, metadata, colors, profile }) => {
    // Check for cover image - use a default city/building image if none exists to match the vibe
    const coverAsset = report.assets.find(
      (a) =>
        a.tags?.includes("cover") || a.label?.toLowerCase().includes("omslag"),
    );
    const coverUrl = coverAsset
      ? coverAsset.url
      : "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80"; // Fallback city image

    // Branding från profile
    const headerText = profile?.headerText || "Agenter Rapport System";
    const showLogo = profile?.displayLogo && profile?.logoUrl;
    const logoUrl = profile?.logoUrl || "";
    const brandColor = profile?.brandColor || colors.primary;
    const accentColor = profile?.accentColor || colors.secondary;

    // Logo HTML för Modern Hero (visas i title-container)
    const logoHtml = showLogo
      ? `
      <div style="margin-bottom: 20px;">
        <img src="${logoUrl}" alt="Logo" style="height: 50px; max-width: 180px; object-fit: contain;" />
      </div>
    `
      : "";

    return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&family=Lora:ital@0;1&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Montserrat', sans-serif; background: white; color: #1f2937; line-height: 1.6; }
    @page { size: A4; margin: 0; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    
    .hero-container {
      position: relative;
      height: 65vh; /* Covers top 65% of page 1 */
      width: 100%;
      overflow: hidden;
      /* Diagonal clip path */
      clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
    }
    
    .hero-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: brightness(0.9) contrast(1.1);
    }
    
    /* Title overlay on the white part */
    .title-container {
      padding: 40px 60px;
      margin-top: -40px; /* Pull up slightly */
    }
    
    .company-label {
      font-size: 12px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 20px;
      font-weight: 600;
    }
    
    .main-title {
      font-size: 56px;
      font-weight: 300; /* Thin */
      text-transform: uppercase;
      line-height: 1.1;
      color: ${brandColor};
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    
    .sub-title {
      font-size: 56px;
      font-weight: 700; /* Bold */
      text-transform: uppercase;
      line-height: 1.1;
      color: ${brandColor};
      letter-spacing: 2px;
      margin-bottom: 30px;
    }
    
    .separator {
      width: 80px;
      height: 6px;
      background-color: ${accentColor};
      margin-bottom: 30px;
    }
    
    .meta-footer {
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #9ca3af;
      font-weight: 600;
    }

    /* Content Pages */
    .content-page {
      padding: 60px;
      page-break-before: always;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 25px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 15px;
    }
    
    .section-number {
      font-size: 48px;
      font-weight: 300;
      color: ${accentColor};
      line-height: 1;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 600;
      text-transform: uppercase;
      color: ${brandColor};
      letter-spacing: 1px;
    }
    
    /* Metadata Grid styling override */
    .modern-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin-top: 60px;
      padding-top: 40px;
      border-top: 1px solid #e5e7eb;
    }
    
    .meta-item label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${accentColor};
      margin-bottom: 5px;
    }
    
    .meta-item div {
      font-family: 'Lora', serif;
      font-size: 16px;
      color: #374151;
    }
  </style>
</head>
<body>
  <!-- Page 1: Cover -->
  <div class="hero-container">
    <img src="${coverUrl}" class="hero-image" />
  </div>
  
  <div class="title-container">
    ${logoHtml}
    <div class="company-label">${escapeHtml(headerText)}</div>
    <div class="main-title">Utrednings</div>
    <div class="sub-title">Rapport</div>
    <div class="separator"></div>
    <div class="meta-footer">
      ${formatDate(report.metadata.scheduledAt)} // ${escapeHtml(report.title)}
    </div>
    
    <!-- Modern Meta Grid -->
    <div class="modern-meta-grid">
      ${Object.entries(metadata)
        .map(
          ([key, value]) => `
        <div class="meta-item">
          <label>${key}</label>
          <div>${escapeHtml(value) || "-"}</div>
        </div>
      `,
        )
        .join("")}
    </div>
  </div>

  <!-- Page 2+: Content -->
  <div class="content-page">
    ${sectionsHtml}
  </div>
</body>
</html>
    `;
  },
};

// ============================================================================
// Export
// ============================================================================

export const PDF_DESIGNS: Record<PdfDesignId, PdfDesignRenderer> = {
  standard: StandardDesign,
  modern_hero: ModernHeroDesign,
};

export function getPdfDesign(id?: string): PdfDesignRenderer {
  return PDF_DESIGNS[(id as PdfDesignId) || "standard"] || StandardDesign;
}
