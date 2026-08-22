"use client";

import { useState } from "react";
import { GlassSidebar } from "./GlassSidebar";
import { MobileNav } from "./MobileNav";
import { TopExamBar } from "./TopExamBar";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { DemoModeToggle } from "@/components/ui/DemoModeToggle";
import { useTheme } from "@/lib/theme-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [aiOpen, setAiOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="relative min-h-screen flex">
      {theme === "dark" ? <div className="atmosphere-dark" /> : (
        <>
          <div className="texture-layer" />
          <div className="dot-grid" />
        </>
      )}

      <GlassSidebar />

      <div className="relative z-10 flex-1 flex flex-col min-w-0 pb-24 lg:pb-6">
        <TopExamBar onOpenAI={() => setAiOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-4 pt-6">{children}</main>
      </div>

      <MobileNav />
      <DemoModeToggle />
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} onOpen={() => setAiOpen(true)} />
    </div>
  );
}
