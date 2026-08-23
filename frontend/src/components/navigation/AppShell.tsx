"use client";

import { useState } from "react";
import { GlassSidebar } from "./GlassSidebar";
import { MobileNav } from "./MobileNav";
import { TopExamBar } from "./TopExamBar";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { DemoModeToggle } from "@/components/ui/DemoModeToggle";
import { useTheme } from "@/lib/theme-context";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="relative min-h-screen flex bg-[var(--bg)] text-[var(--text)]">

      {/* Background atmosphere */}
      {theme === "dark" ? (
        <div className="atmosphere-dark" />
      ) : (
        <>
          <div className="texture-layer" />
          <div className="dot-grid" />
        </>
      )}

      {/* Desktop sidebar */}
      <GlassSidebar />

      {/* Main application area */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">

        {/* Top header (Removed as requested) */}

        {/* Page content */}
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-7 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile navigation */}
      <MobileNav />

      {/* Demo mode (Removed as requested) */}

      {/* AI monitoring assistant */}
      <AIAssistant
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onOpen={() => setAiOpen(true)}
      />
    </div>
  );
}