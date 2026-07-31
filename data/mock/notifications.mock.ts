import type { Notification } from '@/data/types';

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'notif-001', userId: 'usr-001', type: 'plan_ready', title: 'Plantation plan ready', message: 'Your plan for Whitefield Community Garden is ready for review', read: false, date: '2026-07-28' },
  { id: 'notif-002', userId: 'usr-001', type: 'monitoring_due', title: 'Check-in reminder', message: 'Time to submit your monthly check-in for Whitefield Community Garden', read: false, date: '2026-07-28' },
  { id: 'notif-003', userId: 'usr-007', type: 'task_assigned', title: 'New task assigned', message: 'Site assessment for Indiranagar Open Plot scheduled for Aug 2', read: false, date: '2026-07-27' },
  { id: 'notif-004', userId: 'usr-005', type: 'order_received', title: 'New order received', message: 'Order #ORD-002 received - 28 saplings for Koramangala Park Extension', read: true, date: '2026-07-20' },
  { id: 'notif-005', userId: 'usr-003', type: 'assessment_complete', title: 'Assessment submitted', message: 'Kavya Reddy completed assessment for HSR Lake Border', read: true, date: '2026-07-05' },
  { id: 'notif-006', userId: 'usr-012', type: 'credit_confirmed', title: 'Credits confirmed', message: 'Your purchase of 5.0 tCO2e credits has been confirmed', read: true, date: '2026-06-02' },
  { id: 'notif-007', userId: 'usr-009', type: 'review_needed', title: 'Monitoring review needed', message: '3 new check-ins await your scientific review', read: false, date: '2026-07-29' },
  { id: 'notif-008', userId: 'usr-011', type: 'receipt_ready', title: 'Donation receipt ready', message: 'Your 80G receipt for donation of 10,000 is ready to download', read: true, date: '2026-06-05' },
];
