"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  MOCK_USERS,
  MOCK_SPECIES,
  MOCK_SITES,
  MOCK_REQUESTS,
  MOCK_ASSESSMENTS,
  MOCK_PLANS,
  MOCK_INVENTORY,
  MOCK_ORDERS,
  MOCK_CHECKINS,
  MOCK_CARBON_CREDITS,
  MOCK_DONATIONS,
  MOCK_FUND_LEDGER,
  MOCK_VOLUNTEER_TASKS,
  MOCK_NOTIFICATIONS,
  MOCK_ADVISORIES,
} from '@/data/mock';
import type {
  CarbonCredit,
  Donation,
  FundTransaction,
  MonitoringCheckIn,
  Notification,
  PlanSpecies,
  PlantationPlan,
  PlantationRequest,
  PlantationSite,
  RequestStatus,
  ScientistAdvisory,
  SiteAssessment,
  SupplierInventory,
  SupplyOrder,
  User,
  VolunteerTask,
} from '@/data/types';

/* ==========================================================================
   Dhaatri in-memory workflow store.

   The pilot proposal (§5) defines one lifecycle:
     request → assessment → plan → approval → fulfilment → planting → monitoring
   Every screen reads from here, so an action taken in one screen is visible
   everywhere else immediately.

   State is deliberately RAM-only: closing or reloading the app restores the
   seed data, which is what makes it safe to demo repeatedly.
   ========================================================================== */

export type State = {
  users: User[];
  species: typeof MOCK_SPECIES;
  sites: PlantationSite[];
  requests: PlantationRequest[];
  assessments: SiteAssessment[];
  plans: PlantationPlan[];
  inventory: SupplierInventory[];
  orders: SupplyOrder[];
  checkins: MonitoringCheckIn[];
  credits: CarbonCredit[];
  donations: Donation[];
  ledger: FundTransaction[];
  tasks: VolunteerTask[];
  notifications: Notification[];
  advisories: ScientistAdvisory[];
  /** Monotonic counter behind every generated id. */
  seq: number;
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const seed = (): State => ({
  users: clone(MOCK_USERS),
  species: clone(MOCK_SPECIES),
  sites: clone(MOCK_SITES),
  requests: clone(MOCK_REQUESTS),
  assessments: clone(MOCK_ASSESSMENTS),
  plans: clone(MOCK_PLANS),
  inventory: clone(MOCK_INVENTORY),
  orders: clone(MOCK_ORDERS),
  checkins: clone(MOCK_CHECKINS),
  credits: clone(MOCK_CARBON_CREDITS),
  donations: clone(MOCK_DONATIONS),
  ledger: clone(MOCK_FUND_LEDGER),
  tasks: clone(MOCK_VOLUNTEER_TASKS),
  notifications: clone(MOCK_NOTIFICATIONS),
  advisories: clone(MOCK_ADVISORIES),
  seq: 1000,
});

const today = () => new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ carbon */

/**
 * Carbon engine (proposal §7): a function of species, growth stage and
 * VERIFIED survival — never a notional estimate. Versioned so any published
 * figure is traceable to the methodology that produced it.
 */
export const CARBON_METHOD_VERSION = 'v1.2';

export function computeCo2(
  species: PlanSpecies[],
  speciesTable: typeof MOCK_SPECIES,
  survivalPercent = 100,
  ageYears = 1
) {
  // Young trees sequester less; ramps to full rate by year 5.
  const ageFactor = Math.min(1, 0.35 + 0.13 * ageYears);
  const kg = species.reduce((sum, sp) => {
    const ref = speciesTable.find((s) => s.id === sp.speciesId);
    const perTree = ref?.co2PerYear ?? 20;
    return sum + perTree * sp.quantity;
  }, 0);
  return Math.round(kg * ageFactor * (survivalPercent / 100));
}

/* ----------------------------------------------------------------- actions */

type Action =
  | { type: 'RESET' }
  | { type: 'CREATE_SITE'; payload: { site: Omit<PlantationSite, 'id' | 'status'>; model: 'paid' | 'stewardship'; requesterId: string } }
  | { type: 'SUBMIT_ASSESSMENT'; payload: { taskId?: string; assessment: Omit<SiteAssessment, 'id' | 'status'> } }
  | { type: 'CREATE_PLAN'; payload: { plan: Omit<PlantationPlan, 'id' | 'status' | 'version'>; } }
  | { type: 'APPROVE_PLAN'; payload: { planId: string; model: 'paid' | 'stewardship'; payerId: string } }
  | { type: 'PLACE_ORDER'; payload: { planId: string; supplierId: string } }
  | { type: 'ADVANCE_ORDER'; payload: { orderId: string } }
  | { type: 'MARK_PLANTED'; payload: { siteId: string } }
  | { type: 'SUBMIT_CHECKIN'; payload: { checkin: Omit<MonitoringCheckIn, 'id' | 'status' | 'survivalPercent'> } }
  | { type: 'REVIEW_CHECKIN'; payload: { checkinId: string; verdict: 'verified' | 'flagged'; scientistId: string } }
  | { type: 'PUBLISH_ADVISORY'; payload: { advisory: Omit<ScientistAdvisory, 'id'> } }
  | { type: 'PURCHASE_CREDITS'; payload: { organisationId: string; credits: number; amount: number } }
  | { type: 'RETIRE_CREDIT'; payload: { creditId: string } }
  | { type: 'DONATE'; payload: { donorId: string; donorName: string; amount: number; purpose: string; siteId?: string } }
  | { type: 'TOGGLE_TASK'; payload: { taskId: string } }
  | { type: 'MARK_NOTIFICATION'; payload: { id: string; read: boolean } }
  | { type: 'MARK_ALL_NOTIFICATIONS'; payload: { userId: string } };

function notify(
  state: State,
  userId: string,
  type: string,
  title: string,
  message: string
): Notification {
  return {
    id: `N${state.seq + 1}`,
    userId,
    type,
    title,
    message,
    read: false,
    date: today(),
  };
}

/** Advances the request attached to a site. */
function setRequestStatus(state: State, siteId: string, status: RequestStatus) {
  return state.requests.map((r) =>
    r.siteId === siteId ? { ...r, status, updatedAt: today() } : r
  );
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'RESET':
      return seed();

    /* -------------------------------------------------- 1. request ------ */
    case 'CREATE_SITE': {
      const n = state.seq + 1;
      const siteId = `S${n}`;
      const site: PlantationSite = { ...action.payload.site, id: siteId, status: 'pending' };
      const request: PlantationRequest = {
        id: `R${n}`,
        siteId,
        requesterId: action.payload.requesterId,
        status: 'pending',
        model: action.payload.model,
        createdAt: today(),
        updatedAt: today(),
      };
      // Assessment is fieldwork, so a volunteer task is raised immediately.
      const volunteer = state.users.find((u) => u.role === 'volunteer');
      const task: VolunteerTask | null = volunteer
        ? {
            id: `T${n}`,
            volunteerId: volunteer.id,
            type: 'site_assessment',
            siteId,
            status: 'assigned',
            dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
            notes: `Assess ${site.name} for plantation suitability`,
          }
        : null;
      const ops = state.users.find((u) => u.role === 'dhaatri_ops');

      return {
        ...state,
        seq: n,
        sites: [site, ...state.sites],
        requests: [request, ...state.requests],
        tasks: task ? [task, ...state.tasks] : state.tasks,
        notifications: [
          notify(state, action.payload.requesterId, 'request', 'Request received', `${site.name} is queued for site assessment.`),
          ...(ops ? [notify(state, ops.id, 'request', 'New plantation request', `${site.name} needs triage.`)] : []),
          ...(volunteer ? [notify(state, volunteer.id, 'task', 'New assessment assigned', `Please assess ${site.name}.`)] : []),
          ...state.notifications,
        ],
      };
    }

    /* ----------------------------------------------- 2. assessment ------ */
    case 'SUBMIT_ASSESSMENT': {
      const n = state.seq + 1;
      const a: SiteAssessment = { ...action.payload.assessment, id: `A${n}`, status: 'completed' };
      const site = state.sites.find((s) => s.id === a.siteId);
      const ops = state.users.find((u) => u.role === 'dhaatri_ops');

      return {
        ...state,
        seq: n,
        assessments: [a, ...state.assessments],
        sites: state.sites.map((s) => (s.id === a.siteId ? { ...s, status: 'assessed' } : s)),
        requests: setRequestStatus(state, a.siteId, 'assessment_complete'),
        tasks: action.payload.taskId
          ? state.tasks.map((t) => (t.id === action.payload.taskId ? { ...t, status: 'completed' } : t))
          : state.tasks,
        notifications: ops
          ? [notify(state, ops.id, 'assessment', 'Assessment complete', `${site?.name ?? a.siteId} is ready for planning.`), ...state.notifications]
          : state.notifications,
      };
    }

    /* ----------------------------------------------------- 3. plan ------ */
    case 'CREATE_PLAN': {
      const n = state.seq + 1;
      const plan: PlantationPlan = {
        ...action.payload.plan,
        id: `P${n}`,
        status: 'review',
        version: CARBON_METHOD_VERSION,
      };
      const site = state.sites.find((s) => s.id === plan.siteId);
      const req = state.requests.find((r) => r.siteId === plan.siteId);

      return {
        ...state,
        seq: n,
        plans: [plan, ...state.plans],
        sites: state.sites.map((s) => (s.id === plan.siteId ? { ...s, status: 'planned' } : s)),
        requests: setRequestStatus(state, plan.siteId, 'plan_ready'),
        notifications: req
          ? [notify(state, req.requesterId, 'plan', 'Your plantation plan is ready', `Review the plan for ${site?.name ?? plan.siteId}.`), ...state.notifications]
          : state.notifications,
      };
    }

    /* ------------------------------------------- 4. approval & money ---- */
    case 'APPROVE_PLAN': {
      const n = state.seq + 1;
      const plan = state.plans.find((p) => p.id === action.payload.planId);
      if (!plan) return state;

      const site = state.sites.find((s) => s.id === plan.siteId);
      const paid = action.payload.model === 'paid';

      // Model A puts money into the ledger; Model B is a care commitment.
      const inflow: FundTransaction | null = paid
        ? {
            id: `F${n}`,
            type: 'inflow',
            source: state.users.find((u) => u.id === action.payload.payerId)?.name ?? 'End user',
            amount: plan.cost,
            purpose: `Sapling adoption — ${site?.name ?? plan.siteId}`,
            siteId: plan.siteId,
            date: today(),
            category: 'sapling_payment',
          }
        : null;

      const ops = state.users.find((u) => u.role === 'dhaatri_ops');

      return {
        ...state,
        seq: n,
        plans: state.plans.map((p) => (p.id === plan.id ? { ...p, status: 'approved' } : p)),
        sites: state.sites.map((s) => (s.id === plan.siteId ? { ...s, status: 'approved' } : s)),
        requests: state.requests.map((r) =>
          r.siteId === plan.siteId
            ? { ...r, status: 'approved', model: action.payload.model, updatedAt: today() }
            : r
        ),
        ledger: inflow ? [inflow, ...state.ledger] : state.ledger,
        notifications: ops
          ? [notify(state, ops.id, 'approval', 'Plan approved', `${site?.name ?? plan.siteId} — ${paid ? 'paid adoption' : 'stewardship'}. Ready to order.`), ...state.notifications]
          : state.notifications,
      };
    }

    /* ------------------------------------------------ 5. fulfilment ----- */
    case 'PLACE_ORDER': {
      const n = state.seq + 1;
      const plan = state.plans.find((p) => p.id === action.payload.planId);
      if (!plan) return state;

      const order: SupplyOrder = {
        id: `O${n}`,
        planId: plan.id,
        supplierId: action.payload.supplierId,
        items: plan.species,
        total: plan.cost,
        status: 'processing',
        orderedAt: today(),
      };

      // Stock is committed the moment the order is raised.
      const inventory = state.inventory.map((i) => {
        if (i.supplierId !== action.payload.supplierId) return i;
        const line = plan.species.find((sp) => sp.speciesId === i.speciesId);
        return line ? { ...i, stock: Math.max(0, i.stock - line.quantity) } : i;
      });

      const outflow: FundTransaction = {
        id: `F${n}`,
        type: 'outflow',
        source: 'Dhaatri',
        amount: plan.cost,
        purpose: `Sapling supply order ${order.id}`,
        siteId: plan.siteId,
        date: today(),
        category: 'supplier_payment',
      };

      return {
        ...state,
        seq: n,
        orders: [order, ...state.orders],
        inventory,
        ledger: [outflow, ...state.ledger],
        requests: setRequestStatus(state, plan.siteId, 'order_placed'),
        notifications: [
          notify(state, action.payload.supplierId, 'order', 'New supply order', `Order ${order.id} — ${plan.species.reduce((s, x) => s + x.quantity, 0)} saplings.`),
          ...state.notifications,
        ],
      };
    }

    case 'ADVANCE_ORDER': {
      const order = state.orders.find((o) => o.id === action.payload.orderId);
      if (!order) return state;
      const nextStatus = order.status === 'processing' ? 'dispatched' : 'delivered';
      const plan = state.plans.find((p) => p.id === order.planId);

      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === order.id
            ? { ...o, status: nextStatus, deliveredAt: nextStatus === 'delivered' ? today() : o.deliveredAt }
            : o
        ),
        requests: plan
          ? setRequestStatus(state, plan.siteId, nextStatus === 'delivered' ? 'delivered' : 'order_placed')
          : state.requests,
      };
    }

    /* -------------------------------------------------- 6. planting ----- */
    case 'MARK_PLANTED': {
      const n = state.seq + 1;
      const site = state.sites.find((s) => s.id === action.payload.siteId);
      const req = state.requests.find((r) => r.siteId === action.payload.siteId);

      return {
        ...state,
        seq: n,
        sites: state.sites.map((s) => (s.id === action.payload.siteId ? { ...s, status: 'active' } : s)),
        requests: setRequestStatus(state, action.payload.siteId, 'planted'),
        notifications: req
          ? [notify(state, req.requesterId, 'planted', 'Your trees are in the ground', `${site?.name ?? ''} is planted. Monitoring begins now.`), ...state.notifications]
          : state.notifications,
      };
    }

    /* ------------------------------------------------ 7. monitoring ----- */
    case 'SUBMIT_CHECKIN': {
      const n = state.seq + 1;
      const c = action.payload.checkin;
      const survivalPercent = c.totalTrees > 0 ? (c.survivalCount / c.totalTrees) * 100 : 0;
      const checkin: MonitoringCheckIn = {
        ...c,
        id: `C${n}`,
        survivalPercent: Math.round(survivalPercent * 10) / 10,
        status: 'pending_review',
      };
      const scientist = state.users.find((u) => u.role === 'scientist');
      const site = state.sites.find((s) => s.id === c.siteId);

      return {
        ...state,
        seq: n,
        checkins: [checkin, ...state.checkins],
        requests: setRequestStatus(state, c.siteId, 'monitoring'),
        notifications: scientist
          ? [notify(state, scientist.id, 'monitoring', 'Check-in awaiting review', `${site?.name ?? c.siteId} — ${checkin.survivalPercent}% survival.`), ...state.notifications]
          : state.notifications,
      };
    }

    case 'REVIEW_CHECKIN': {
      const n = state.seq + 1;
      const c = state.checkins.find((x) => x.id === action.payload.checkinId);
      if (!c) return state;
      const site = state.sites.find((s) => s.id === c.siteId);
      const flagged = action.payload.verdict === 'flagged';

      // A flagged check-in automatically raises a corrective advisory (§5.7).
      const advisory: ScientistAdvisory | null = flagged
        ? {
            id: `AD${n}`,
            scientistId: action.payload.scientistId,
            siteId: c.siteId,
            date: today(),
            type: 'care',
            title: 'Survival below expected range',
            content: `Survival at ${c.survivalPercent}% on ${site?.name ?? c.siteId}. Inspect irrigation and mulching; schedule replacement planting for lost saplings.`,
            status: 'published',
          }
        : null;

      const owner = site ? state.users.find((u) => u.id === site.ownerId) : undefined;

      return {
        ...state,
        seq: n,
        checkins: state.checkins.map((x) =>
          x.id === c.id ? { ...x, status: action.payload.verdict } : x
        ),
        advisories: advisory ? [advisory, ...state.advisories] : state.advisories,
        notifications: owner
          ? [
              notify(
                state,
                owner.id,
                'monitoring',
                flagged ? 'Advisory issued for your site' : 'Check-in verified',
                flagged
                  ? `A scientist flagged the latest check-in on ${site?.name}.`
                  : `Your check-in on ${site?.name} has been verified.`
              ),
              ...state.notifications,
            ]
          : state.notifications,
      };
    }

    case 'PUBLISH_ADVISORY': {
      const n = state.seq + 1;
      return {
        ...state,
        seq: n,
        advisories: [{ ...action.payload.advisory, id: `AD${n}` }, ...state.advisories],
      };
    }

    /* ------------------------------------------------- carbon credits --- */
    case 'PURCHASE_CREDITS': {
      const n = state.seq + 1;
      // Credits are backed by the sites with verified monitoring data.
      const backing = state.sites.filter((s) => s.status === 'active' || s.status === 'completed');
      const credit: CarbonCredit = {
        id: `CC${n}`,
        organisationId: action.payload.organisationId,
        credits: action.payload.credits,
        amount: action.payload.amount,
        siteIds: backing.slice(0, 3).map((s) => s.id),
        purchasedAt: today(),
        certificateId: `CERT-${n}`,
        status: 'active',
      };
      const org = state.users.find((u) => u.id === action.payload.organisationId);

      return {
        ...state,
        seq: n,
        credits: [credit, ...state.credits],
        ledger: [
          {
            id: `F${n}`,
            type: 'inflow',
            source: org?.name ?? 'Organisation',
            amount: action.payload.amount,
            purpose: `Carbon credit purchase — ${action.payload.credits} tCO₂e`,
            date: today(),
            category: 'carbon_credit',
          },
          ...state.ledger,
        ],
        notifications: org
          ? [notify(state, org.id, 'credit', 'Certificate issued', `${credit.certificateId} for ${credit.credits} tCO₂e.`), ...state.notifications]
          : state.notifications,
      };
    }

    case 'RETIRE_CREDIT':
      return {
        ...state,
        credits: state.credits.map((c) =>
          c.id === action.payload.creditId ? { ...c, status: 'retired' } : c
        ),
      };

    /* ------------------------------------------------------ donations --- */
    case 'DONATE': {
      const n = state.seq + 1;
      const donation: Donation = {
        id: `D${n}`,
        donorId: action.payload.donorId,
        donorName: action.payload.donorName,
        amount: action.payload.amount,
        purpose: action.payload.purpose,
        siteId: action.payload.siteId,
        date: today(),
        receiptId: `RCPT-${n}`,
        status: 'completed',
      };

      return {
        ...state,
        seq: n,
        donations: [donation, ...state.donations],
        ledger: [
          {
            id: `F${n}`,
            type: 'inflow',
            source: donation.donorName,
            amount: donation.amount,
            purpose: donation.purpose,
            siteId: donation.siteId,
            date: today(),
            category: 'donation',
          },
          ...state.ledger,
        ],
        notifications: [
          notify(state, donation.donorId, 'donation', 'Receipt issued', `${donation.receiptId} — thank you for supporting Dhaatri.`),
          ...state.notifications,
        ],
      };
    }

    /* ----------------------------------------------------------- misc --- */
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId
            ? { ...t, status: t.status === 'completed' ? 'assigned' : 'completed' }
            : t
        ),
      };

    case 'MARK_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.id ? { ...n, read: action.payload.read } : n
        ),
      };

    case 'MARK_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.userId === action.payload.userId ? { ...n, read: true } : n
        ),
      };

    default:
      return state;
  }
}

/* -------------------------------------------------------------- provider */

type Store = {
  state: State;
  /** Workflow actions, named for the lifecycle stage they advance. */
  createSite: (p: Extract<Action, { type: 'CREATE_SITE' }>['payload']) => void;
  submitAssessment: (p: Extract<Action, { type: 'SUBMIT_ASSESSMENT' }>['payload']) => void;
  createPlan: (p: Extract<Action, { type: 'CREATE_PLAN' }>['payload']) => void;
  approvePlan: (p: Extract<Action, { type: 'APPROVE_PLAN' }>['payload']) => void;
  placeOrder: (p: Extract<Action, { type: 'PLACE_ORDER' }>['payload']) => void;
  advanceOrder: (p: Extract<Action, { type: 'ADVANCE_ORDER' }>['payload']) => void;
  markPlanted: (p: Extract<Action, { type: 'MARK_PLANTED' }>['payload']) => void;
  submitCheckin: (p: Extract<Action, { type: 'SUBMIT_CHECKIN' }>['payload']) => void;
  reviewCheckin: (p: Extract<Action, { type: 'REVIEW_CHECKIN' }>['payload']) => void;
  publishAdvisory: (p: Extract<Action, { type: 'PUBLISH_ADVISORY' }>['payload']) => void;
  purchaseCredits: (p: Extract<Action, { type: 'PURCHASE_CREDITS' }>['payload']) => void;
  retireCredit: (p: Extract<Action, { type: 'RETIRE_CREDIT' }>['payload']) => void;
  donate: (p: Extract<Action, { type: 'DONATE' }>['payload']) => void;
  toggleTask: (p: { taskId: string }) => void;
  markNotification: (p: { id: string; read: boolean }) => void;
  markAllNotifications: (p: { userId: string }) => void;
  reset: () => void;
};

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seed);

  const bind = useCallback(
    <T,>(type: Action['type']) =>
      (payload: T) =>
        dispatch({ type, payload } as unknown as Action),
    []
  );

  const value = useMemo<Store>(
    () => ({
      state,
      createSite: bind('CREATE_SITE'),
      submitAssessment: bind('SUBMIT_ASSESSMENT'),
      createPlan: bind('CREATE_PLAN'),
      approvePlan: bind('APPROVE_PLAN'),
      placeOrder: bind('PLACE_ORDER'),
      advanceOrder: bind('ADVANCE_ORDER'),
      markPlanted: bind('MARK_PLANTED'),
      submitCheckin: bind('SUBMIT_CHECKIN'),
      reviewCheckin: bind('REVIEW_CHECKIN'),
      publishAdvisory: bind('PUBLISH_ADVISORY'),
      purchaseCredits: bind('PURCHASE_CREDITS'),
      retireCredit: bind('RETIRE_CREDIT'),
      donate: bind('DONATE'),
      toggleTask: bind('TOGGLE_TASK'),
      markNotification: bind('MARK_NOTIFICATION'),
      markAllNotifications: bind('MARK_ALL_NOTIFICATIONS'),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [state, bind]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/* ------------------------------------------------------------ selectors */

export function useData() {
  return useStore().state;
}

/** Everything hanging off one site — the shape most detail screens want. */
export function useSiteBundle(siteId?: string) {
  const s = useData();
  return useMemo(() => {
    const site = s.sites.find((x) => x.id === siteId);
    const plan = s.plans.find((p) => p.siteId === siteId);
    const checkins = s.checkins
      .filter((c) => c.siteId === siteId)
      .sort((a, b) => +new Date(a.date) - +new Date(b.date));
    return {
      site,
      request: s.requests.find((r) => r.siteId === siteId),
      assessment: s.assessments.find((a) => a.siteId === siteId),
      plan,
      checkins,
      advisories: s.advisories.filter((a) => a.siteId === siteId),
      order: plan ? s.orders.find((o) => o.planId === plan.id) : undefined,
      trees: plan?.species.reduce((sum, sp) => sum + sp.quantity, 0) ?? 0,
      latest: checkins[checkins.length - 1],
    };
  }, [s, siteId]);
}

/** Platform-wide impact figures, used by the admin and public dashboards. */
export function useImpact() {
  const s = useData();
  return useMemo(() => {
    const trees = s.plans.reduce((sum, p) => sum + p.species.reduce((a, sp) => a + sp.quantity, 0), 0);
    const verified = s.checkins.filter((c) => c.status === 'verified');
    const survival = verified.length
      ? verified.reduce((a, c) => a + c.survivalPercent, 0) / verified.length
      : s.checkins.length
        ? s.checkins.reduce((a, c) => a + c.survivalPercent, 0) / s.checkins.length
        : 0;
    const co2 = s.plans.reduce(
      (sum, p) => sum + computeCo2(p.species, s.species, survival || 100),
      0
    );
    const inflow = s.ledger.filter((l) => l.type === 'inflow').reduce((a, l) => a + l.amount, 0);
    const outflow = s.ledger.filter((l) => l.type === 'outflow').reduce((a, l) => a + l.amount, 0);
    return { trees, survival, co2, inflow, outflow, available: inflow - outflow };
  }, [s]);
}
