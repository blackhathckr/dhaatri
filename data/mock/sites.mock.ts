import type { PlantationSite } from '@/data/types';

export const MOCK_SITES: PlantationSite[] = [
  { id: 'site-001', name: 'Whitefield Community Garden', ownerId: 'usr-001', latitude: 12.9698, longitude: 77.7500, area: 500, status: 'active', soilType: 'Loamy', sunlight: 'Full', waterAccess: 'Borewell' },
  { id: 'site-002', name: 'Koramangala Park Extension', ownerId: 'usr-002', latitude: 12.9352, longitude: 77.6245, area: 1200, status: 'assessed', soilType: 'Clay', sunlight: 'Partial', waterAccess: 'Municipal' },
  { id: 'site-003', name: 'Indiranagar Open Plot', ownerId: 'usr-001', latitude: 12.9784, longitude: 77.6408, area: 300, status: 'pending', soilType: 'Sandy Loam', sunlight: 'Full', waterAccess: 'Rain-fed' },
  { id: 'site-004', name: 'HSR Lake Border', ownerId: 'usr-002', latitude: 12.9116, longitude: 77.6389, area: 2000, status: 'planned', soilType: 'Loamy', sunlight: 'Full', waterAccess: 'Lake' },
  { id: 'site-005', name: 'JP Nagar Vacant Lot', ownerId: 'usr-011', latitude: 12.9077, longitude: 77.5846, area: 800, status: 'completed', soilType: 'Red Soil', sunlight: 'Full', waterAccess: 'Borewell' },
];
