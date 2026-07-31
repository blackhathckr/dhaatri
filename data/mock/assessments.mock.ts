import type { SiteAssessment } from '@/data/types';

export const MOCK_ASSESSMENTS: SiteAssessment[] = [
  { id: 'asmt-001', siteId: 'site-001', volunteerId: 'usr-007', date: '2026-06-05', soilPh: 6.8, soilType: 'Loamy', areaConfirmed: 480, sunlightHours: '6-8 hrs', waterSource: 'Borewell, 50m', obstacles: 'Power lines on east', photos: 4, status: 'completed' },
  { id: 'asmt-002', siteId: 'site-002', volunteerId: 'usr-008', date: '2026-06-25', soilPh: 7.2, soilType: 'Clay', areaConfirmed: 1150, sunlightHours: '4-6 hrs', waterSource: 'Municipal tap', obstacles: 'Low-lying area, drainage needed', photos: 6, status: 'completed' },
  { id: 'asmt-003', siteId: 'site-004', volunteerId: 'usr-007', date: '2026-07-05', soilPh: 6.5, soilType: 'Loamy', areaConfirmed: 1950, sunlightHours: '8+ hrs', waterSource: 'Lake proximity', obstacles: 'Footpath through site', photos: 5, status: 'completed' },
];
