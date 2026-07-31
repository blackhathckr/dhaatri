import type { PlantationPlan } from '@/data/types';

export const MOCK_PLANS: PlantationPlan[] = [
  {
    id: 'plan-001', siteId: 'site-001', createdById: 'usr-003',
    species: [
      { speciesId: 'sp-001', name: 'Neem', quantity: 10 },
      { speciesId: 'sp-003', name: 'Peepal', quantity: 5 },
      { speciesId: 'sp-007', name: 'Mango', quantity: 8 },
      { speciesId: 'sp-011', name: 'Bamboo', quantity: 15 },
    ],
    method: 'Miyawaki', layout: 'Grid 2m spacing', estimatedCo2PerYear: 1.6, cost: 4250, status: 'approved', version: '1.0',
  },
  {
    id: 'plan-002', siteId: 'site-002', createdById: 'usr-004',
    species: [
      { speciesId: 'sp-006', name: 'Rain Tree', quantity: 8 },
      { speciesId: 'sp-005', name: 'Gulmohar', quantity: 6 },
      { speciesId: 'sp-010', name: 'Tamarind', quantity: 4 },
      { speciesId: 'sp-001', name: 'Neem', quantity: 10 },
    ],
    method: 'Standard', layout: 'Perimeter + cluster', estimatedCo2PerYear: 1.8, cost: 5100, status: 'review', version: '1.0',
  },
  {
    id: 'plan-003', siteId: 'site-004', createdById: 'usr-003',
    species: [
      { speciesId: 'sp-002', name: 'Banyan', quantity: 5 },
      { speciesId: 'sp-001', name: 'Neem', quantity: 20 },
      { speciesId: 'sp-011', name: 'Bamboo', quantity: 30 },
      { speciesId: 'sp-008', name: 'Jackfruit', quantity: 10 },
      { speciesId: 'sp-009', name: 'Coconut', quantity: 8 },
    ],
    method: 'Mixed', layout: 'Zone-based', estimatedCo2PerYear: 4.2, cost: 8750, status: 'draft', version: '0.1',
  },
];
