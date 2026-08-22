# ExamGuard — AI Monitoring Command Center

Premium frontend for the ExamGuard AI examination monitoring dashboard.
Built with Next.js (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Lucide React, and Recharts.

This is a **frontend-only** implementation. All data is mocked in `lib/mock-data/` and
every network interaction is stubbed behind service-style functions so a real backend
can be wired in later without touching UI code.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To build for production:

```bash
npm run build
npm start
```

## What's included

- **Design system** — warm ivory/sage light mode + atmospheric navy→teal→green dark
  mode, subtle grain/dot texture, glass surfaces, cinematic light↔dark transition
  (`app/globals.css`, `lib/theme-context.tsx`)
- **Navigation** — floating glass sidebar (desktop), bottom nav + sheet (mobile), top
  examination status bar with live clock
- **Overview** — exam status banner, animated KPI cards, live activity timeline, room
  risk breakdown
- **Live Monitoring** — camera grid with animated AI detection bounding boxes,
  scanline/grid texture, per-camera detail modal
- **Active Alerts** — filterable/searchable alert cards, right-side glass detail
  drawer with evidence, AI analysis, and timeline
- **Students** — searchable table with per-student glass drawer (risk timeline, AI
  observations)
- **Exam Sessions** — live / upcoming / completed sections
- **Analytics** — Recharts visualizations styled to the ExamGuard palette
- **Reports** — mock report generation with PDF/CSV export affordances
- **Settings** — tabbed settings (Monitoring, AI Detection, Alerts, Notifications,
  Appearance, Security) with toggles, sliders, dropdowns
- **ExamGuard AI Assistant** — floating glass chat panel with suggested prompts,
  typing indicator, and mock responses
- **Demo Mode** — toggle (bottom-right) that simulates a new AI event every 8–15s,
  updating the activity feed and alert counters live across the whole app

## Connecting a real backend later

Every page reads from `lib/mock-data/*.ts` and `lib/types.ts` defines the shared
interfaces (`Alert`, `Student`, `Camera`, `Detection`, `ExamSession`,
`SystemHealth`, `ActivityEvent`, `AIMessage`). To connect real data:

1. Replace the imports from `lib/mock-data/*` with calls to your API/WebSocket layer.
2. Keep the same TypeScript shapes (or update `lib/types.ts` and the components will
   flag any mismatches).
3. `lib/demo-context.tsx` shows the shape of a live event stream — swap its
   `setInterval` simulation for a WebSocket subscription when ready.

## Project structure

```
app/                    Routes (App Router)
components/
  navigation/            Sidebar, mobile nav, top bar, app shell
  dashboard/              Exam banner, metric cards, activity feed
  monitoring/             Camera grid, camera card, detection overlay
  alerts/                 Alert card, filters, detail drawer
  ai/                     AI assistant panel + message bubble
  students/               Student table + drawer
  analytics/               Recharts wrappers
  settings/                Toggle control
  ui/                      GlassCard, GlassButton, StatusBadge, Modal, Drawer, DemoModeToggle
lib/
  mock-data/              Mock data per domain
  theme-context.tsx       Light/dark theme provider
  demo-context.tsx        Simulated live-event provider
  types.ts                Shared TypeScript interfaces
```

## Notes

- Fonts (Inter, Instrument Serif, Geist Mono) are self-hosted via `@fontsource/*` so
  the app builds fully offline — no Google Fonts network dependency.
- Respects `prefers-reduced-motion` and includes visible focus states throughout.
- Tested at 1440px, 1024px, and 390px breakpoints.
