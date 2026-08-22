import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AlertCircle, Users, BarChart2, List, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const routes = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    href: '/dashboard',
    exact: true,
  },
  {
    label: 'Live Alerts',
    icon: AlertCircle,
    href: '/dashboard/alerts',
  },
  {
    label: 'Students',
    icon: Users,
    href: '/dashboard/students',
  },
  {
    label: 'Analytics',
    icon: BarChart2,
    href: '/dashboard/analytics',
  },
  {
    label: 'Event Log',
    icon: List,
    href: '/dashboard/events',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-zinc-950 text-white w-64 border-r border-zinc-800">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <h1 className="text-2xl font-bold">DRISHTI AI</h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => {
            const isActive = route.exact ? pathname === route.href : pathname.startsWith(route.href);
            return (
              <Button
                key={route.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start hover:bg-zinc-800",
                  isActive ? "bg-zinc-800 text-white" : "text-zinc-400"
                )}
                asChild
              >
                <Link href={route.href}>
                  <route.icon className="h-5 w-5 mr-3" />
                  {route.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
