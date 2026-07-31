import type { PlantationRequest } from '@/data/types';

export const MOCK_REQUESTS: PlantationRequest[] = [
  { id: 'req-001', siteId: 'site-001', requesterId: 'usr-001', status: 'approved', model: 'paid', createdAt: '2026-06-01', updatedAt: '2026-06-15' },
  { id: 'req-002', siteId: 'site-002', requesterId: 'usr-002', status: 'assessment_complete', model: 'stewardship', createdAt: '2026-06-10', updatedAt: '2026-07-01' },
  { id: 'req-003', siteId: 'site-003', requesterId: 'usr-001', status: 'pending', model: 'paid', createdAt: '2026-07-15', updatedAt: '2026-07-15' },
  { id: 'req-004', siteId: 'site-004', requesterId: 'usr-002', status: 'plan_ready', model: 'stewardship', createdAt: '2026-06-20', updatedAt: '2026-07-10' },
  { id: 'req-005', siteId: 'site-005', requesterId: 'usr-011', status: 'completed', model: 'paid', createdAt: '2026-04-01', updatedAt: '2026-06-30' },
];
