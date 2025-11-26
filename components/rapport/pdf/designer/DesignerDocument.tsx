import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { BrandingConfig } from '@/lib/types/report-builder';

export type DesignerBlock =
  | { id: string; type: 'heading'; level: 1 | 2 | 3; text: string }
  | { id: string; type: 'paragraph'; text: string }
  | { id: string; type: 'image'; url: string; caption?: string }
  | { id: string; type: 'pageBreak' };

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', lineHeight: 1.6, backgroundColor: '#ffffff' },
  header: { marginBottom: 30, borderBottom: '3pt solid #22c55e', paddingBottom: 20 },
  logo: { width: 140, marginBottom: 15, objectFit: 'contain' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  section: { marginBottom: 16 },
  h1: { fontSize: 22, fontWeight: 'bold', marginBottom: 6, color: '#0f172a' },
  h2: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#111827' },
  h3: { fontSize: 14, fontWeight: 'bold', marginBottom: 3, color: '#111827' },
  p: { fontSize: 11, lineHeight: 1.8, color: '#1f2937' },
  img: { marginVertical: 10, maxHeight: 400, maxWidth: '100%', objectFit: 'contain', border: '1pt solid #e2e8f0', borderRadius: 4 },
  caption: { fontSize: 9, color: '#64748b', marginTop: 4, textAlign: 'center', fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 9, color: '#94a3b8', borderTop: '1pt solid #e2e8f0', paddingTop: 10 },
});

export function DesignerDocument({ blocks, branding }: { blocks: DesignerBlock[]; branding: BrandingConfig }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {branding?.logoUrl ? <Image src={branding.logoUrl} style={styles.logo} /> : null}
          {branding?.companyName ? <Text style={styles.title}>{branding.companyName}</Text> : null}
        </View>

        {blocks.map((b) => {
          if (b.type === 'pageBreak') return <View key={b.id} break />;
          if (b.type === 'heading') {
            const levelStyle = b.level === 1 ? styles.h1 : b.level === 2 ? styles.h2 : styles.h3;
            return (
              <View key={b.id} style={styles.section} wrap>
                <Text style={levelStyle}>{b.text}</Text>
              </View>
            );
          }
          if (b.type === 'paragraph') {
            return (
              <View key={b.id} style={styles.section} wrap>
                <Text style={styles.p}>{b.text}</Text>
              </View>
            );
          }
          if (b.type === 'image') {
            return (
              <View key={b.id} style={styles.section} wrap={false}>
                {b.url ? <Image src={b.url} style={styles.img} /> : null}
                {b.caption ? <Text style={styles.caption}>{b.caption}</Text> : null}
              </View>
            );
          }
          return null;
        })}

        <View style={styles.footer} fixed>
          {branding?.footerNote ? <Text>{branding.footerNote}</Text> : null}
        </View>
      </Page>
    </Document>
  );
}
