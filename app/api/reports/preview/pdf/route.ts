/**
 * API Route: POST /api/reports/preview/pdf
 * Genererar och sparar PDF-rapport
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { createClient } from '@supabase/supabase-js';
import React from 'react';
import { ReportDocument } from '@/components/rapport/pdf/ReportDocument';
import { buildReportData, validateReportData } from '@/lib/report-pdf/buildReportData';
import { usePdfProfileStore } from '@/lib/pdf-profile-store';
import type { ReportFormData } from '@/lib/types/report-builder';

// Types
interface RequestBody extends Partial<ReportFormData> {
  reportId?: string;
  branding?: any;
  save?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RequestBody = await request.json();
    
    // Validera input
    const validation = validateReportData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Ogiltig data', errors: validation.errors },
        { status: 400 }
      );
    }
    
    // Hämta branding från store eller request
    const branding = body.branding || usePdfProfileStore.getState().profile;
    
    // Generera eller använd befintligt report ID
    const reportId = body.reportId || crypto.randomUUID();
    
    // Bygg ReportData
    const reportData = buildReportData(body, branding, reportId);
    
    // Skapa React-element för PDF
    const element = React.createElement(ReportDocument, { 
      report: reportData 
    });
    
    // Rendera PDF till stream
    const pdfStream = await renderToStream(element as any);
    
    // Konvertera stream till buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream as any) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);
    
    // Om vi ska spara till Supabase
    if (body.save) {
      try {
        // Skapa Supabase client
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // Hämta användare (för autentisering)
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        
        if (token) {
          // Sätt auth token
          const { data: { user } } = await supabase.auth.getUser(token);
          
          if (user) {
            // Spara PDF till storage
            const storagePath = `${user.id}/reports/${reportId}/report.pdf`;
            const { error: uploadError } = await supabase.storage
              .from('reports')
              .upload(storagePath, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true,
              });
            
            if (uploadError) {
              console.error('Storage upload error:', uploadError);
            }
            
            // Spara metadata i database
            const { error: dbError } = await supabase
              .from('reports')
              .upsert({
                id: reportId,
                user_id: user.id,
                title: reportData.title,
                report_number: reportData.caseId,
                date: reportData.date,
                customer_name: reportData.customer.name,
                company_name: reportData.customer.company,
                location: reportData.customer.address,
                inspector_name: reportData.investigator,
                introduction: body.inledning,
                background: body.bakgrund,
                methods: body.matmetoder,
                conclusion: body.slutsats,
                storage_path: storagePath,
                metadata: body,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            
            if (dbError) {
              console.error('Database error:', dbError);
            }
          }
        }
      } catch (saveError) {
        console.error('Save error:', saveError);
        // Fortsätt ändå - PDF har genererats
      }
    }
    
    // Returnera PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="rapport-${reportId}.pdf"`,
        'X-Report-Id': reportId,
      },
    });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { 
        error: 'Kunde inte generera PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
