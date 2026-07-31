import type { CarbonCredit } from '@/data/types';

export const MOCK_CARBON_CREDITS: CarbonCredit[] = [
  { id: 'cc-001', organisationId: 'usr-012', credits: 5.0, amount: 25000, siteIds: ['site-001', 'site-005'], purchasedAt: '2026-06-01', certificateId: 'cert-001', status: 'active' },
  { id: 'cc-002', organisationId: 'usr-013', credits: 10.0, amount: 50000, siteIds: ['site-001', 'site-004', 'site-005'], purchasedAt: '2026-07-01', certificateId: 'cert-002', status: 'active' },
  { id: 'cc-003', organisationId: 'usr-012', credits: 3.0, amount: 15000, siteIds: ['site-002'], purchasedAt: '2026-07-15', status: 'pending' },
];
