/**
 * ReportDocument - React PDF Component
 * Renderar en rapport som PDF med react-pdf/renderer
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import type { BrandingConfig } from '@/lib/types/report-builder';

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '3pt solid #22c55e',
    paddingBottom: 20,
  },
  logo: {
    width: 140,
    marginBottom: 15,
    objectFit: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: 'normal',
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 20,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    gap: 5,
  },
  metaLabel: {
    fontWeight: 500,
    color: '#475569',
  },
  metaValue: {
    color: '#1f2937',
  },
  section: {
    marginBottom: 30,
    pageBreakInside: 'avoid',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#0f172a',
    borderBottom: '1pt solid #e2e8f0',
    paddingBottom: 6,
  },
  sectionContent: {
    fontSize: 11,
    lineHeight: 1.8,
    color: '#1f2937',
    textAlign: 'justify',
    marginTop: 8,
  },
  leakArea: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    border: '1pt solid #e2e8f0',
  },
  leakAreaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0f172a',
  },
  image: {
    marginVertical: 15,
    maxHeight: 400,
    maxWidth: '100%',
    objectFit: 'contain',
    border: '1pt solid #e2e8f0',
    borderRadius: 4,
  },
  imageCaption: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: '#94a3b8',
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 9,
    color: '#94a3b8',
  },
});

// Types
export interface ReportData {
  id: string;
  caseId: string;
  title: string;
  date: string;
  investigator: string;
  customer: {
    name: string;
    company?: string;
    address?: string;
  };
  sections: ReportSection[];
  images?: string[];
  gannTableImage?: string;
  leakAreas?: LeakAreaData[];
  branding: BrandingConfig;
  signature?: {
    name: string;
    role?: string;
  };
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  type?: 'text' | 'image' | 'table';
}

export interface LeakAreaData {
  id: string;
  name: string;
  description: string;
  images?: string[];
}

// Component
export const ReportDocument: React.FC<{ report: ReportData }> = ({ report }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {report.branding?.logoUrl && (
            <Image src={report.branding.logoUrl} style={styles.logo} />
          )}
          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.subtitle}>
            {report.customer.company || report.customer.name}
          </Text>
          {report.customer.address && (
            <Text style={styles.subtitle}>{report.customer.address}</Text>
          )}
        </View>

        {/* Metadata */}
        <View style={styles.metadata}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Rapportnummer:</Text>
            <Text style={styles.metaValue}>{report.caseId}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Datum:</Text>
            <Text style={styles.metaValue}>{report.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Utredare:</Text>
            <Text style={styles.metaValue}>{report.investigator}</Text>
          </View>
        </View>

        {/* Sections */}
        {report.sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {/* Leak Areas */}
        {report.leakAreas && report.leakAreas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Läckageområden</Text>
            {report.leakAreas.map((area) => (
              <View key={area.id} style={styles.leakArea}>
                <Text style={styles.leakAreaTitle}>{area.name}</Text>
                <Text style={styles.sectionContent}>{area.description}</Text>
                {area.images && area.images.map((img, idx) => (
                  <Image key={idx} src={img} style={styles.image} />
                ))}
              </View>
            ))}
          </View>
        )}

        {/* GANN Table */}
        {report.gannTableImage && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>GANN-tabell</Text>
            <Image src={report.gannTableImage} style={styles.image} />
            <Text style={styles.imageCaption}>Fuktmätning enligt GANN-metoden</Text>
          </View>
        )}

        {/* Image Gallery */}
        {report.images && report.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bildgalleri</Text>
            {report.images.map((img, idx) => (
              <View key={idx} style={{ marginBottom: 20 }}>
                <Image src={img} style={styles.image} />
                <Text style={styles.imageCaption}>Bild {idx + 1} av {report.images?.length || 0}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{report.branding?.companyName}</Text>
          {report.branding?.footerNote && (
            <Text>{report.branding.footerNote}</Text>
          )}
        </View>

        {/* Page Number */}
        <Text 
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => 
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};
