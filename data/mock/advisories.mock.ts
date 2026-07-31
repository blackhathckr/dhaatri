import type { ScientistAdvisory } from '@/data/types';

export const MOCK_ADVISORIES: ScientistAdvisory[] = [
  { id: 'adv-001', scientistId: 'usr-009', siteId: 'site-001', date: '2026-07-10', type: 'care', title: 'Watering advisory', content: 'Reduce watering frequency to twice per week during monsoon. Bamboo section shows signs of waterlogging.', status: 'published' },
  { id: 'adv-002', scientistId: 'usr-010', siteId: 'site-005', date: '2026-07-15', type: 'growth', title: 'Growth milestone', content: 'Neem saplings showing excellent growth at 3-month mark. Recommend first pruning in September.', status: 'published' },
  { id: 'adv-003', scientistId: 'usr-009', siteId: 'site-002', date: '2026-07-20', type: 'soil', title: 'Drainage recommendation', content: 'Clay soil at assessment site needs raised bed preparation before planting. Add 6 inches of organic compost mix.', status: 'draft' },
];
