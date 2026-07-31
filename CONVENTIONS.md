# Dhaatri Web - Platform Conventions

> **PREREQUISITE**: Read `../CONVENTIONS.md` first. This file extends those shared conventions with Next.js/web-specific patterns.

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | v4 |
| Component Library | shadcn/ui | latest |
| Animation | Framer Motion | 12.x |
| Icons | Lucide React | latest |
| Font | Plus Jakarta Sans | Google Fonts |
| Class Utility | clsx + tailwind-merge (`cn()`) | - |
| 3D (optional) | Three.js + img2threejs | - |

---

## 2. Folder Structure

```
web/
├── app/                              # Next.js App Router
│   ├── (marketing)/                  # Public marketing pages (no auth)
│   │   ├── page.tsx                  # Landing page
│   │   ├── about/page.tsx
│   │   ├── impact/page.tsx           # Public impact dashboard
│   │   ├── transparency/page.tsx     # Public fund transparency
│   │   └── layout.tsx                # Marketing layout (navbar + footer)
│   │
│   ├── (auth)/                       # Auth pages (login, register)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (app)/                        # Protected app (requires auth)
│   │   ├── layout.tsx                # App shell (sidebar + header)
│   │   ├── dashboard/page.tsx        # Role-aware dashboard
│   │   │
│   │   ├── sites/                    # Plantation sites
│   │   │   ├── page.tsx              # List view
│   │   │   ├── new/page.tsx          # Register new site
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Site detail
│   │   │       ├── assessment/page.tsx
│   │   │       ├── plan/page.tsx
│   │   │       └── monitoring/page.tsx
│   │   │
│   │   ├── requests/                 # Plantation requests
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   │
│   │   ├── supply/                   # Supplier module
│   │   │   ├── inventory/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   └── orders/[id]/page.tsx
│   │   │
│   │   ├── volunteers/               # Volunteer management
│   │   │   ├── page.tsx
│   │   │   └── tasks/page.tsx
│   │   │
│   │   ├── science/                  # Scientist module
│   │   │   ├── species/page.tsx
│   │   │   ├── carbon-engine/page.tsx
│   │   │   ├── advisories/page.tsx
│   │   │   └── monitoring-review/page.tsx
│   │   │
│   │   ├── carbon-credits/           # Organisation carbon credits
│   │   │   ├── page.tsx
│   │   │   ├── purchase/page.tsx
│   │   │   └── certificates/page.tsx
│   │   │
│   │   ├── donations/                # Donations module
│   │   │   ├── page.tsx
│   │   │   └── receipts/page.tsx
│   │   │
│   │   ├── admin/                    # Platform admin
│   │   │   ├── users/page.tsx
│   │   │   ├── roles/page.tsx
│   │   │   ├── species-catalogue/page.tsx
│   │   │   ├── regions/page.tsx
│   │   │   ├── grievances/page.tsx
│   │   │   └── content/page.tsx
│   │   │
│   │   ├── profile/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── globals.css                   # Tailwind base + design tokens
│   ├── layout.tsx                    # Root layout (providers, fonts)
│   └── not-found.tsx
│
├── components/
│   ├── landing/                      # Marketing/landing page sections
│   │   ├── hero.tsx                  # (rebranded from Finsyc Header)
│   │   ├── impact-metrics.tsx        # (rebranded from Metrics)
│   │   ├── features.tsx
│   │   ├── how-it-works.tsx
│   │   ├── testimonials.tsx
│   │   ├── partners.tsx
│   │   ├── cta-footer.tsx
│   │   └── mascot-hero.tsx           # 3D/animated mascot section
│   │
│   ├── ui/                           # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── sidebar.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   ├── toast.tsx
│   │   └── ... (installed via `npx shadcn@latest add`)
│   │
│   ├── shared/                       # App-wide reusable components
│   │   ├── app-sidebar.tsx           # Main navigation sidebar
│   │   ├── header.tsx                # App header with user menu
│   │   ├── role-guard.tsx            # RBAC wrapper
│   │   ├── page-header.tsx           # Consistent page headers
│   │   ├── empty-state.tsx           # Reusable empty state with mascot
│   │   ├── loading-state.tsx         # Skeleton/spinner patterns
│   │   ├── error-state.tsx           # Error display with retry
│   │   ├── stat-card.tsx             # Metric display cards
│   │   ├── geo-map.tsx               # Map component wrapper
│   │   ├── photo-upload.tsx          # Geo-tagged photo upload
│   │   ├── status-badge.tsx          # Workflow status badges
│   │   ├── timeline.tsx              # Workflow timeline
│   │   └── data-table.tsx            # Reusable data table with sorting/filter
│   │
│   └── features/                     # Feature-specific components
│       ├── sites/
│       │   ├── site-card.tsx
│       │   ├── site-form.tsx
│       │   ├── site-map-view.tsx
│       │   └── site-detail-tabs.tsx
│       ├── assessment/
│       │   ├── assessment-form.tsx
│       │   ├── assessment-checklist.tsx
│       │   └── soil-analysis-card.tsx
│       ├── plantation/
│       │   ├── plan-builder.tsx
│       │   ├── species-picker.tsx
│       │   ├── plan-timeline.tsx
│       │   └── plan-approval-card.tsx
│       ├── monitoring/
│       │   ├── check-in-card.tsx
│       │   ├── survival-chart.tsx
│       │   ├── photo-gallery.tsx
│       │   └── monitoring-timeline.tsx
│       ├── carbon/
│       │   ├── carbon-calculator.tsx
│       │   ├── credit-card.tsx
│       │   ├── certificate-preview.tsx
│       │   └── offset-chart.tsx
│       ├── donations/
│       │   ├── donate-form.tsx
│       │   ├── fund-flow-chart.tsx
│       │   └── receipt-card.tsx
│       └── dashboard/
│           ├── citizen-dashboard.tsx
│           ├── admin-dashboard.tsx
│           ├── supplier-dashboard.tsx
│           ├── volunteer-dashboard.tsx
│           ├── scientist-dashboard.tsx
│           ├── org-dashboard.tsx
│           └── public-impact-dashboard.tsx
│
├── hooks/                            # Custom React hooks
│   ├── use-auth.ts
│   ├── use-role.ts
│   ├── use-mock-data.ts
│   ├── use-geolocation.ts
│   ├── use-media-query.ts
│   └── use-debounce.ts
│
├── data/                             # Mock data & types
│   ├── mock/
│   │   ├── users.mock.ts
│   │   ├── sites.mock.ts
│   │   ├── requests.mock.ts
│   │   ├── assessments.mock.ts
│   │   ├── plans.mock.ts
│   │   ├── species.mock.ts
│   │   ├── suppliers.mock.ts
│   │   ├── volunteers.mock.ts
│   │   ├── monitoring.mock.ts
│   │   ├── carbon-credits.mock.ts
│   │   ├── donations.mock.ts
│   │   ├── notifications.mock.ts
│   │   └── index.ts                  # Re-exports all mock data
│   └── types/
│       ├── user.ts
│       ├── site.ts
│       ├── request.ts
│       ├── assessment.ts
│       ├── plan.ts
│       ├── species.ts
│       ├── supplier.ts
│       ├── volunteer.ts
│       ├── monitoring.ts
│       ├── carbon-credit.ts
│       ├── donation.ts
│       ├── notification.ts
│       └── index.ts
│
├── lib/                              # Utilities & helpers
│   ├── utils.ts                      # cn() helper, general utils
│   ├── format.ts                     # Date, currency, number formatting
│   ├── geo.ts                        # Geo-location utilities
│   ├── carbon.ts                     # CO2 calculation helpers
│   ├── roles.ts                      # Role definitions & permissions
│   └── constants.ts                  # App-wide constants
│
├── public/
│   ├── mascot/                       # Mascot assets
│   │   ├── ankur-waving.png
│   │   ├── ankur-celebrating.png
│   │   └── ...
│   ├── icons/                        # Favicon, app icons
│   ├── images/                       # Static images
│   └── animations/                   # Lottie JSON files
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts                # Design tokens config
├── components.json                   # shadcn/ui config
└── CONVENTIONS.md                    # This file
```

---

## 3. Next.js App Router Patterns

### Route Groups
- `(marketing)` - Public pages, SEO-optimized, server components by default
- `(auth)` - Authentication pages, minimal layout
- `(app)` - Protected application, client-heavy with sidebar layout

### Layouts
```typescript
// app/(app)/layout.tsx - App shell
import { AppSidebar } from '@/components/shared/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </SidebarProvider>
  );
}
```

### Loading & Error States
- Every route group should have `loading.tsx` (skeleton UI, not spinners)
- Every route group should have `error.tsx` (error boundary with retry + mascot)
- Use `not-found.tsx` for 404 with mascot and helpful navigation

```typescript
// app/(app)/sites/loading.tsx
import { SiteCardSkeleton } from '@/components/features/sites/site-card';

export default function SitesLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SiteCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### Server vs Client Components
- **Default to Server Components** for pages and layouts
- Use `"use client"` only when you need: useState, useEffect, event handlers, browser APIs, Framer Motion
- Keep client boundaries as low as possible in the component tree
- For the prototype (mock data), most feature components will be `"use client"` - that's fine

---

## 4. shadcn/ui Usage

### Installation
```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog input select table tabs sidebar badge skeleton toast dropdown-menu command avatar separator sheet scroll-area
```

### Customization Rules
- **Never modify** files in `components/ui/` directly for feature logic
- **Do customize** the theme via CSS variables in `globals.css`
- Extend shadcn components by wrapping them in `components/shared/` or `components/features/`

```typescript
// GOOD - Wrap and extend
// components/shared/status-badge.tsx
import { Badge, type BadgeProps } from '@/components/ui/badge';

const STATUS_VARIANTS = {
  pending: 'bg-sand text-soil',
  active: 'bg-mist text-forest',
  completed: 'bg-emerald text-white',
} as const;

interface StatusBadgeProps {
  status: keyof typeof STATUS_VARIANTS;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge className={STATUS_VARIANTS[status]}>{status}</Badge>;
}
```

### Theme (CSS Variables in globals.css)
```css
@layer base {
  :root {
    --background: 36 33% 95%;        /* #F5F1EB cream */
    --foreground: 152 42% 18%;       /* #1B4332 forest */
    --primary: 152 42% 30%;          /* #2D6A4F emerald */
    --primary-foreground: 0 0% 100%;
    --secondary: 30 45% 64%;         /* #D4A373 earth */
    --secondary-foreground: 0 0% 100%;
    --accent: 152 42% 53%;           /* #52B788 fresh */
    --muted: 80 25% 83%;             /* #CCD5AE olive */
    --muted-foreground: 158 10% 46%; /* #6B7F75 drift */
    --destructive: 354 48% 51%;      /* #C1414A danger */
    --border: 36 16% 87%;            /* #E0DDD6 stone */
    --ring: 152 42% 30%;             /* #2D6A4F emerald */
    --radius: 0.75rem;               /* 12px md */
    --card: 0 0% 100%;
    --card-foreground: 152 42% 18%;
    --popover: 0 0% 100%;
    --popover-foreground: 152 42% 18%;
    --input: 36 16% 87%;
  }

  .dark {
    --background: 150 50% 7%;        /* #0D2818 */
    --foreground: 140 35% 86%;       /* #D8F3DC */
    --primary: 152 42% 30%;
    --card: 152 42% 18%;
    --border: 152 42% 30%;
    /* ... */
  }
}
```

---

## 5. Tailwind CSS Conventions

### Class Order
Follow this order for readability (most tools auto-sort):
1. Layout (`flex`, `grid`, `block`)
2. Positioning (`relative`, `absolute`, `z-10`)
3. Box model (`w-full`, `h-10`, `p-4`, `m-2`)
4. Typography (`text-sm`, `font-bold`, `text-forest`)
5. Visual (`bg-cream`, `border`, `rounded-md`, `shadow-md`)
6. Interaction (`hover:`, `focus:`, `active:`)
7. Animation (`transition`, `duration-200`)
8. Responsive (`md:`, `lg:`)

### Utility Usage
```typescript
// GOOD - use cn() for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  'rounded-md border p-4 transition-shadow',
  isActive && 'border-emerald shadow-md',
  isCompact && 'p-2',
)} />

// BAD - string interpolation
<div className={`rounded-md border p-4 ${isActive ? 'border-emerald' : ''}`} />
```

### No @apply Abuse
- Do NOT use `@apply` to create utility classes
- Exception: Very few global styles that must apply everywhere

### Responsive Design
- Mobile-first: base styles are mobile, scale up with `md:` and `lg:`
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Test at 375px (mobile), 768px (tablet), 1280px (desktop)

---

## 6. Framer Motion Patterns

### Standard Fade-In
```typescript
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.21, 0.45, 0.32, 0.9] },
};
```

### Staggered List
```typescript
const container = {
  animate: { transition: { staggerChildren: 0.05 } },
};
const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

<motion.div variants={container} initial="initial" animate="animate">
  {items.map(i => <motion.div key={i.id} variants={item} />)}
</motion.div>
```

### Scroll-Triggered
```typescript
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-50px' }}
  transition={{ duration: 0.5 }}
/>
```

### Page Transition (layout-level)
```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### Reduced Motion
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const animation = prefersReducedMotion ? {} : { initial, animate, transition };
```

---

## 7. Role-Based Access Control (RBAC)

### Roles
```typescript
export const USER_ROLES = {
  CITIZEN: 'citizen',
  DHAATRI_OPS: 'dhaatri_ops',
  SUPPLIER: 'supplier',
  VOLUNTEER: 'volunteer',
  SCIENTIST: 'scientist',
  DONOR: 'donor',
  ORGANISATION: 'organisation',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
```

### Route Permissions
```typescript
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['citizen', 'dhaatri_ops', 'supplier', 'volunteer', 'scientist', 'donor', 'organisation', 'admin'],
  '/sites': ['citizen', 'dhaatri_ops', 'volunteer', 'scientist', 'admin'],
  '/supply': ['supplier', 'dhaatri_ops', 'admin'],
  '/science': ['scientist', 'dhaatri_ops', 'admin'],
  '/carbon-credits': ['organisation', 'dhaatri_ops', 'admin'],
  '/admin': ['admin'],
  // ...
};
```

### RoleGuard Component
```typescript
<RoleGuard allowed={['admin', 'dhaatri_ops']}>
  <AdminPanel />
</RoleGuard>
```

### Sidebar Navigation
- Sidebar items are filtered by user role
- Each role sees only their relevant navigation
- Dashboard content adapts to role (different widgets/metrics per role)

---

## 8. Data Fetching (Prototype Phase)

### Mock Data Pattern
```typescript
// data/mock/sites.mock.ts
import type { PlantationSite } from '@/data/types/site';

export const MOCK_SITES: PlantationSite[] = [
  {
    id: 'site-001',
    name: 'Whitefield Community Garden',
    // ...
  },
];

// hooks/use-mock-data.ts
export function useMockSites() {
  // Simulate async behavior for realistic UX
  const [data, setData] = useState<PlantationSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(MOCK_SITES);
      setIsLoading(false);
    }, 800); // Simulate network delay to test loading states
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading, error: null };
}
```

### Transition to Real API
When backend arrives, replace `useMockSites()` internals with TanStack Query:
```typescript
export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: () => apiClient.get<PlantationSite[]>('/sites'),
  });
}
```
The component interface stays identical - only the hook implementation changes.
