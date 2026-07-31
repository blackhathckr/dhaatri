import type { Donation, FundTransaction } from '@/data/types';

export const MOCK_DONATIONS: Donation[] = [
  { id: 'don-001', donorId: 'usr-011', donorName: 'Deepa Mohan', amount: 5000, purpose: 'General plantation fund', date: '2026-05-15', receiptId: 'rcpt-001', status: 'completed' },
  { id: 'don-002', donorId: 'usr-011', donorName: 'Deepa Mohan', amount: 10000, purpose: 'Whitefield project', siteId: 'site-001', date: '2026-06-01', receiptId: 'rcpt-002', status: 'completed' },
  { id: 'don-003', donorId: 'anonymous', donorName: 'Anonymous', amount: 2500, purpose: 'General', date: '2026-06-20', receiptId: 'rcpt-003', status: 'completed' },
  { id: 'don-004', donorId: 'usr-002', donorName: 'Rahul Nair', amount: 1000, purpose: 'HSR Lake project', siteId: 'site-004', date: '2026-07-10', receiptId: 'rcpt-004', status: 'completed' },
];

export const MOCK_FUND_LEDGER: FundTransaction[] = [
  { id: 'txn-001', type: 'inflow', source: 'Sapling payment (req-001)', amount: 4250, purpose: 'Plantation plan fulfilment', siteId: 'site-001', date: '2026-06-16', category: 'sapling_payment' },
  { id: 'txn-002', type: 'inflow', source: 'Donation (don-001)', amount: 5000, purpose: 'General fund', date: '2026-05-15', category: 'donation' },
  { id: 'txn-003', type: 'inflow', source: 'Donation (don-002)', amount: 10000, purpose: 'Whitefield project', siteId: 'site-001', date: '2026-06-01', category: 'donation' },
  { id: 'txn-004', type: 'inflow', source: 'Carbon credit (cc-001)', amount: 25000, purpose: 'Carbon offset', siteId: 'site-001', date: '2026-06-01', category: 'carbon_credit' },
  { id: 'txn-005', type: 'outflow', source: 'Supplier payment (ord-001)', amount: 2575, purpose: 'Sapling procurement', siteId: 'site-001', date: '2026-06-20', category: 'supplier_payment' },
  { id: 'txn-006', type: 'outflow', source: 'Volunteer stipend', amount: 1500, purpose: 'Site assessments (Jun)', date: '2026-06-30', category: 'operations' },
  { id: 'txn-007', type: 'outflow', source: 'Sapling transport', amount: 800, purpose: 'Delivery to site-001', siteId: 'site-001', date: '2026-06-20', category: 'logistics' },
  { id: 'txn-008', type: 'inflow', source: 'Carbon credit (cc-002)', amount: 50000, purpose: 'Carbon offset', date: '2026-07-01', category: 'carbon_credit' },
  { id: 'txn-009', type: 'inflow', source: 'Sapling payment (req-005)', amount: 6500, purpose: 'Plantation plan fulfilment', siteId: 'site-005', date: '2026-04-05', category: 'sapling_payment' },
  { id: 'txn-010', type: 'outflow', source: 'Supplier payment (various)', amount: 4200, purpose: 'Sapling procurement', siteId: 'site-005', date: '2026-04-10', category: 'supplier_payment' },
];
