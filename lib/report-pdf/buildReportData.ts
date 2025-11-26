/**
 * Build ReportData for PDF generation
 * Transformerar ReportFormData till struktur som PDF-komponenten förväntar sig
 */

import type { ReportFormData, BrandingConfig } from '@/lib/types/report-builder';
import type { ReportData, ReportSection, LeakAreaData } from '@/components/rapport/pdf/ReportDocument';
import { resolveTemplateText } from '@/lib/report-templates/resolveTemplateText';

/**
 * Bygger ReportData från formData och branding
 */
export function buildReportData(
  formData: Partial<ReportFormData>,
  branding?: BrandingConfig,
  reportId?: string
): ReportData {
  const now = new Date();
  
  // Generera ID om det inte finns
  const id = reportId || crypto.randomUUID();
  
  // Generera case ID
  const caseId = formData.caseId || formData.projektId || `CASE-${Date.now()}`;
  
  // Titel
  const title = `Läckagerapport - ${formData.foretag || formData.mottagare || 'Projekt'}`;
  
  // Datum
  const date = formData.datum ?? now.toISOString().split('T')[0] ?? '';
  
  // Utredare
  const investigator = formData.utredare || 'Utredare';
  
  // Customer info
  const customer = {
    name: formData.mottagare || '',
    company: formData.foretag,
    address: formData.adress,
  };
  
  // Bygg sektioner
  const sections: ReportSection[] = [];
  
  // Inledning (om den finns)
  if (formData.inledning?.trim()) {
    sections.push({
      id: 'intro',
      title: 'Inledning',
      content: resolveTemplateText(formData.inledning, formData),
      type: 'text',
    });
  }
  
  // Bakgrund (endast om det finns innehåll)
  if (formData.bakgrund?.trim()) {
    sections.push({
      id: 'background',
      title: 'Bakgrund',
      content: resolveTemplateText(formData.bakgrund, formData),
      type: 'text',
    });
  }
  
  // Mätmetoder (endast om det finns innehåll)
  if (formData.matmetoder?.trim()) {
    sections.push({
      id: 'methods',
      title: 'Mätmetoder',
      content: resolveTemplateText(formData.matmetoder, formData),
      type: 'text',
    });
  }
  
  // Slutsats (endast om det finns innehåll)
  if (formData.slutsats?.trim()) {
    sections.push({
      id: 'conclusion',
      title: 'Slutsats',
      content: resolveTemplateText(formData.slutsats, formData),
      type: 'text',
    });
  }
  
  // Lägg till anpassade sektioner från formData.sections om de finns
  if (formData.sections && Array.isArray(formData.sections)) {
    formData.sections.forEach((section: any) => {
      if (section.content?.trim() || section.title) {
        sections.push({
          id: section.id || crypto.randomUUID(),
          title: section.title || 'Sektion',
          content: section.content || '',
          type: section.type || 'text',
        });
      }
    });
  }
  
  // Konvertera läckageområden
  const leakAreas: LeakAreaData[] = formData.leakAreas?.map(area => ({
    id: area.id,
    name: area.name,
    description: area.description,
    images: area.images,
  })) || [];
  
  // Default branding om inget anges
  const defaultBranding: BrandingConfig = {
    companyName: formData.foretag || 'Rapport',
    theme: 'modern',
    footerNote: `Genererad ${now.toLocaleDateString('sv-SE')}`,
  };
  
  // Signatur
  const signature = formData.utredare ? {
    name: formData.utredare,
    role: 'Utredare' as string | undefined,
  } : undefined;
  
  return {
    id,
    caseId,
    title,
    date,
    investigator,
    customer,
    sections,
    images: formData.images,
    gannTableImage: formData.gannTableImage,
    leakAreas,
    branding: { ...defaultBranding, ...branding },
    signature,
  };
}

/**
 * Validerar att formData har all nödvändig info för PDF
 */
export function validateReportData(formData: Partial<ReportFormData>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Kräv grunddata
  if (!formData.mottagare?.trim()) {
    errors.push('Mottagare saknas');
  }
  if (!formData.foretag?.trim()) {
    errors.push('Företag saknas');
  }
  if (!formData.utredare?.trim()) {
    errors.push('Utredare saknas');
  }
  
  // Kräv minst en textsektion eller anpassade sektioner
  const hasContent = 
    formData.bakgrund?.trim() ||
    formData.matmetoder?.trim() ||
    formData.slutsats?.trim() ||
    formData.inledning?.trim() ||
    (formData.sections && formData.sections.length > 0) ||
    (formData.images && formData.images.length > 0) ||
    formData.gannTableImage;
    
  if (!hasContent) {
    errors.push('Minst en sektion eller bild måste finnas');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
