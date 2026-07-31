import type { MonitoringCheckIn } from '@/data/types';

export const MOCK_CHECKINS: MonitoringCheckIn[] = [
  { id: 'mon-001', siteId: 'site-001', userId: 'usr-001', date: '2026-07-01', survivalCount: 36, totalTrees: 38, survivalPercent: 94.7, photos: 3, geoTagged: true, notes: 'All healthy, good growth', status: 'verified' },
  { id: 'mon-002', siteId: 'site-001', userId: 'usr-007', date: '2026-07-15', survivalCount: 35, totalTrees: 38, survivalPercent: 92.1, photos: 4, geoTagged: true, notes: '1 Peepal dried, replaced', status: 'verified' },
  { id: 'mon-003', siteId: 'site-001', userId: 'usr-001', date: '2026-07-28', survivalCount: 36, totalTrees: 38, survivalPercent: 94.7, photos: 2, geoTagged: true, notes: 'Replacement thriving', status: 'pending_review' },
  { id: 'mon-004', siteId: 'site-005', userId: 'usr-008', date: '2026-06-15', survivalCount: 42, totalTrees: 45, survivalPercent: 93.3, photos: 5, geoTagged: true, notes: 'Excellent growth', status: 'verified' },
  { id: 'mon-005', siteId: 'site-005', userId: 'usr-011', date: '2026-07-01', survivalCount: 43, totalTrees: 45, survivalPercent: 95.6, photos: 3, geoTagged: true, notes: 'New shoots observed', status: 'verified' },
];
