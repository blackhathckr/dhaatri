import type { User } from '@/data/types';

export const MOCK_USERS: User[] = [
  { id: 'usr-001', name: 'Priya Sharma', role: 'citizen', email: 'priya@example.com', phone: '+91 98765 43210', location: 'Whitefield, Bangalore' },
  { id: 'usr-002', name: 'Rahul Nair', role: 'citizen', email: 'rahul@example.com', phone: '+91 87654 32109', location: 'Koramangala, Bangalore' },
  { id: 'usr-003', name: 'Ananya Desai', role: 'dhaatri_ops', email: 'ananya@dhaatri.org', phone: '+91 76543 21098', location: 'Indiranagar, Bangalore' },
  { id: 'usr-004', name: 'Vikram Patel', role: 'dhaatri_ops', email: 'vikram@dhaatri.org', phone: '+91 65432 10987', location: 'HSR Layout, Bangalore' },
  { id: 'usr-005', name: 'Ramesh Nursery', role: 'supplier', email: 'ramesh@greennursery.com', phone: '+91 54321 09876', location: 'Hosur Road, Bangalore' },
  { id: 'usr-006', name: 'Lakshmi Plants', role: 'supplier', email: 'lakshmi@lakshmiplants.com', phone: '+91 43210 98765', location: 'Yelahanka, Bangalore' },
  { id: 'usr-007', name: 'Kavya Reddy', role: 'volunteer', email: 'kavya@example.com', phone: '+91 32109 87654', location: 'Marathahalli, Bangalore' },
  { id: 'usr-008', name: 'Suresh Kumar', role: 'volunteer', email: 'suresh@example.com', phone: '+91 21098 76543', location: 'JP Nagar, Bangalore' },
  { id: 'usr-009', name: 'Dr. Meera Iyer', role: 'scientist', email: 'meera@iisc.ac.in', phone: '+91 10987 65432', location: 'IISc Campus, Bangalore' },
  { id: 'usr-010', name: 'Dr. Arun Joshi', role: 'scientist', email: 'arun@ncbs.res.in', phone: '+91 09876 54321', location: 'NCBS, Bangalore' },
  { id: 'usr-011', name: 'Deepa Mohan', role: 'donor', email: 'deepa@example.com', phone: '+91 98761 23456', location: 'Jayanagar, Bangalore' },
  { id: 'usr-012', name: 'TechCorp India', role: 'organisation', email: 'csr@techcorp.in', phone: '+91 80 4567 8900', location: 'Electronic City, Bangalore' },
  { id: 'usr-013', name: 'GreenFuture Ltd', role: 'organisation', email: 'sustainability@greenfuture.co', phone: '+91 80 3456 7890', location: 'Whitefield, Bangalore' },
  { id: 'usr-014', name: 'Admin User', role: 'admin', email: 'admin@dhaatri.org', phone: '+91 80 1234 5678', location: 'Central, Bangalore' },
];

export function getUserById(id: string) {
  return MOCK_USERS.find(u => u.id === id);
}

export function getUsersByRole(role: string) {
  return MOCK_USERS.filter(u => u.role === role);
}
