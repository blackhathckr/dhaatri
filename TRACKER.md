# Dhaatri Web - Screen & Task Tracker

> Tracks every screen, component, and task for the web prototype.
> Follows conventions defined in `CONVENTIONS.md` and `../CONVENTIONS.md`.

---

## Screen Inventory

### Marketing Pages `(marketing)/`
| Route | Screen | Status | Key Components |
|-------|--------|--------|---------------|
| `/` | Landing Page | NOT STARTED | hero, impact-metrics, features, how-it-works, testimonials, partners, cta-footer |
| `/about` | About Dhaatri | NOT STARTED | mission, team, vision |
| `/impact` | Public Impact Dashboard | NOT STARTED | public-impact-dashboard, stat-card, survival-chart, offset-chart |
| `/transparency` | Fund Transparency | NOT STARTED | fund-flow-chart, donation-table, allocation-breakdown |

### Auth Pages `(auth)/`
| Route | Screen | Status | Key Components |
|-------|--------|--------|---------------|
| `/login` | Login | NOT STARTED | login form, social login, mascot greeting |
| `/register` | Register | NOT STARTED | multi-step registration, role selection |
| `/forgot-password` | Forgot Password | NOT STARTED | email input, success state |

### App Pages `(app)/` - by Role

#### All Roles
| Route | Screen | Status | Notes |
|-------|--------|--------|-------|
| `/dashboard` | Role Dashboard | NOT STARTED | Renders different dashboard per role |
| `/profile` | Profile | NOT STARTED | Edit profile, avatar, preferences |
| `/notifications` | Notifications | NOT STARTED | Notification list, mark read, filters |
| `/settings` | Settings | NOT STARTED | Language, theme, notification prefs |

#### Citizen Screens
| Route | Screen | Status | Notes |
|-------|--------|--------|-------|
| `/sites` | My Sites | NOT STARTED | List of registered sites with map view |
| `/sites/new` | Register Site | NOT STARTED | Form with geo-picker, area, photos |
| `/sites/[id]` | Site Detail | NOT STARTED | Tabs: overview, plan, monitoring, timeline |
| `/sites/[id]/monitoring` | Monitoring | NOT STARTED | Check-in history, survival chart, photos |
| `/requests` | My Requests | NOT STARTED | Plantation request list with status |
| `/requests/[id]` | Request Detail | NOT STARTED | Request timeline, approval status |

#### Dhaatri Ops Screens
| Route | Screen | Status | Notes |
|-------|--------|--------|-------|
| `/dashboard` | Ops Dashboard | NOT STARTED | All requests, sites, pipeline overview |
| `/sites` | All Sites | NOT STARTED | Full site management with filters |
| `/sites/[id]/assessment` | Assessment Review | NOT STARTED | Review volunteer assessment data |
| `/sites/[id]/plan` | Create/Edit Plan | NOT STARTED | Plan builder with species picker |
| `/requests` | All Requests | NOT STARTED | Request queue, assign, approve |

#### Supplier Screens
| Route | Screen | Status | Notes |
|-------|--------|--------|-------|
| `/dashboard` | Supplier Dashboard | NOT STARTED | Orders, inventory summary |
| `/supply/inventory` | Inventory | NOT STARTED | Species stock, add/update |
| `/supply/orders` | Orders | NOT STARTED | Order list, status management |
| `/supply/orders/[id]` | Order Detail | NOT STARTED | Order items, delivery tracking |

#### Volunteer Screens
| Route | Screen | Status | Notes |
|-------|--------|--------|-------|
| `/dashboard` | Volunteer Dashboard | NOT STARTED | Tasks, upcoming inspections |
| `/volunteers/tasks` | My Tasks | NOT STARTED | Assignment list, accept/complete |
| `/sites/[id]/assessment` | Site Assessment | NOT STARTED | Assessment form, photo upload |

#### Scientist Screens
| Route | Screen | Status | Notes |
|-------|--------|--------|-------|
| `/dashboard` | Scientist Dashboard | NOT STARTED | Review queue, monitoring alerts |
| `/science/species` | Species Catalogue | NOT STARTED | Species list, add/edit, CO2 data |
| `/science/carbon-engine` | Carbon Engine | NOT STARTED | Formula config, version history |
| `/science/advisories` | Advisories | NOT STARTED | Issue advisories, review monitoring |
| `/science/monitoring-review` | Monitoring Review | NOT STARTED | Review check-ins, approve data |

#### Donor Screens
| Route | Screen | Status | Notes |
|-------|--------|--------|-------|
| `/dashboard` | Donor Dashboard | NOT STARTED | Donation history, impact |
| `/donations` | Donate | NOT STARTED | Donation form, amount, purpose |
| `/donations/receipts` | Receipts | NOT STARTED | Download receipts, history |

#### Organisation Screens
| Route | Screen | Status | Notes |
|-------|--------|--------|-------|
| `/dashboard` | Org Dashboard | NOT STARTED | Credits purchased, retired, plantations |
| `/carbon-credits` | Carbon Credits | NOT STARTED | Available credits, purchase history |
| `/carbon-credits/purchase` | Purchase Credits | NOT STARTED | Select credits, payment |
| `/carbon-credits/certificates` | Certificates | NOT STARTED | Download certificates |

#### Admin Screens
| Route | Screen | Status | Notes |
|-------|--------|--------|-------|
| `/dashboard` | Admin Dashboard | NOT STARTED | Platform overview, key metrics |
| `/admin/users` | User Management | NOT STARTED | User list, role assignment, status |
| `/admin/roles` | Role Management | NOT STARTED | RBAC configuration |
| `/admin/species-catalogue` | Species Catalogue | NOT STARTED | Master species data |
| `/admin/regions` | Regions | NOT STARTED | Region/locality management |
| `/admin/grievances` | Grievances | NOT STARTED | Support tickets, resolution |
| `/admin/content` | Content Management | NOT STARTED | CMS for marketing content |

---

## Shared Components Tracker

| Component | Status | Notes |
|-----------|--------|-------|
| `app-sidebar.tsx` | NOT STARTED | Role-aware navigation |
| `header.tsx` | NOT STARTED | User menu, notifications, search |
| `role-guard.tsx` | NOT STARTED | RBAC wrapper |
| `page-header.tsx` | NOT STARTED | Title, breadcrumbs, actions |
| `empty-state.tsx` | NOT STARTED | Mascot + message + CTA |
| `loading-state.tsx` | NOT STARTED | Skeleton patterns |
| `error-state.tsx` | NOT STARTED | Error display + retry |
| `stat-card.tsx` | NOT STARTED | Metric display |
| `geo-map.tsx` | NOT STARTED | Map component |
| `photo-upload.tsx` | NOT STARTED | File upload with preview |
| `status-badge.tsx` | NOT STARTED | Workflow status |
| `timeline.tsx` | NOT STARTED | Workflow timeline |
| `data-table.tsx` | NOT STARTED | Sortable, filterable table |

---

## Current Task Queue

1. Install dependencies (`npm install`)
2. Install and configure shadcn/ui
3. Set up Tailwind design tokens (colors, fonts)
4. Rebrand Finsyc landing page components to Dhaatri
5. Build app shell (sidebar + header + layout)
6. Build mock data files
7. Build shared components (empty state, loading, etc.)
8. Build dashboards (start with citizen, then others)
9. Build core workflows screen by screen
