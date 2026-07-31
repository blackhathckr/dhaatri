import type { VolunteerTask } from '@/data/types';

export const MOCK_VOLUNTEER_TASKS: VolunteerTask[] = [
  { id: 'task-001', volunteerId: 'usr-007', type: 'site_assessment', siteId: 'site-003', status: 'assigned', dueDate: '2026-08-02', notes: 'New site, needs assessment' },
  { id: 'task-002', volunteerId: 'usr-008', type: 'inspection', siteId: 'site-001', status: 'completed', dueDate: '2026-07-15', notes: 'Quarterly inspection' },
  { id: 'task-003', volunteerId: 'usr-007', type: 'inspection', siteId: 'site-005', status: 'completed', dueDate: '2026-07-20', notes: 'Monthly check' },
  { id: 'task-004', volunteerId: 'usr-008', type: 'site_assessment', siteId: 'site-004', status: 'completed', dueDate: '2026-07-05', notes: 'Assessment done' },
  { id: 'task-005', volunteerId: 'usr-007', type: 'data_collection', siteId: 'site-001', status: 'in_progress', dueDate: '2026-08-01', notes: 'Growth measurement' },
];
