"use client";

import Link from "next/link";
import React, { useMemo } from "react";
import { IS_DEMO_MODE } from "@/lib/supabase";

export default function DebugPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const maskedAnon = useMemo(() => {
    if (!anonKey) return "MISSING";
    const len = anonKey.length;
    if (len <= 8) return "********";
    return `${anonKey.slice(0, 4)}...${anonKey.slice(-4)} (len=${len})`;
  }, [anonKey]);

  const status = (ok: boolean) => (
    <span
      style={{
        padding: "2px 6px",
        borderRadius: 6,
        background: ok ? "#DCFCE7" : "#FEE2E2",
        color: ok ? "#166534" : "#991B1B",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {ok ? "OK" : "MISSING"}
    </span>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#F9FAFB",
      }}
    >
      <div
        style={{
          width: 600,
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Config Debug
        </h1>
        <p style={{ color: "#6B7280", marginBottom: 20 }}>
          Quick check to ensure the client picked up your Supabase env vars.
        </p>

        <div style={{ display: "grid", rowGap: 12 }}>
          <div>
            <div style={{ fontWeight: 600 }}>IS_DEMO_MODE</div>
            <div>
              {status(!IS_DEMO_MODE)}{" "}
              <span style={{ color: "#6B7280", marginLeft: 8 }}>
                {IS_DEMO_MODE
                  ? "Demo mode ON (env not loaded)"
                  : "Demo mode OFF (env loaded)"}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 600 }}>NEXT_PUBLIC_SUPABASE_URL</div>
            <div>
              {status(!!supabaseUrl)}{" "}
              <code
                style={{
                  marginLeft: 8,
                  background: "#F3F4F6",
                  padding: "2px 6px",
                  borderRadius: 6,
                }}
              >
                {supabaseUrl || "<not set>"}
              </code>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 600 }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
            <div>
              {status(!!anonKey)}{" "}
              <code
                style={{
                  marginLeft: 8,
                  background: "#F3F4F6",
                  padding: "2px 6px",
                  borderRadius: 6,
                }}
              >
                {maskedAnon}
              </code>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 14, color: "#374151" }}>
          <p>Expected URL domain should match your project:</p>
          <ul style={{ marginLeft: 18, listStyle: "disc" }}>
            <li>https://yroeeqykhwlviuganwti.supabase.co</li>
          </ul>
        </div>

        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          <Link href="/auth/login" style={{ color: "#2563EB" }}>
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
