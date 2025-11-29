import { renderToStream } from "@react-pdf/renderer";
import { type NextRequest, NextResponse } from "next/server";
import React from "react";
import {
  type DesignerBlock,
  DesignerDocument,
} from "@/components/rapport/pdf/designer/DesignerDocument";
import type { BrandingConfig } from "@/lib/types/report-builder";

interface RequestBody {
  blocks: DesignerBlock[];
  branding?: BrandingConfig;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!Array.isArray(body.blocks)) {
      return NextResponse.json(
        { error: "blocks måste vara en array" },
        { status: 400 },
      );
    }

    const branding = body.branding || {};

    const element = React.createElement(DesignerDocument as any, {
      blocks: body.blocks,
      branding,
    });

    const pdfStream = await renderToStream(element as any);

    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream as any) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="designer-preview.pdf"',
      },
    });
  } catch (error) {
    console.error("Designer PDF preview error:", error);
    return NextResponse.json(
      { error: "Kunde inte generera PDF" },
      { status: 500 },
    );
  }
}
