import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import { DemoModeProvider } from "@/lib/demo-context";
import { AppShell } from "@/components/navigation/AppShell";

export const metadata: Metadata = {
  title: "ExamGuard — AI Monitoring",
  description: "AI-powered examination monitoring command center.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <DemoModeProvider>
            <AppShell>{children}</AppShell>
          </DemoModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
