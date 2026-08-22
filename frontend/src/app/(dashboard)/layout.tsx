import { DemoModeProvider } from "@/lib/demo-context";
import { AppShell } from "@/components/navigation/AppShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoModeProvider>
      <AppShell>
        {children}
      </AppShell>
    </DemoModeProvider>
  );
}