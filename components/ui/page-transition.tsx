"use client";

import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Simplified transition - CSS-only for better performance
// Framer Motion adds overhead; use CSS transitions instead
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="animate-in fade-in duration-150">
      {children}
    </div>
  );
}
