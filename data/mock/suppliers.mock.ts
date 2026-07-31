import type { SupplierInventory, SupplyOrder } from '@/data/types';

export const MOCK_INVENTORY: SupplierInventory[] = [
  { supplierId: 'usr-005', speciesId: 'sp-001', speciesName: 'Neem', stock: 200, unitPrice: 45, minOrder: 10, deliveryDays: 3 },
  { supplierId: 'usr-005', speciesId: 'sp-003', speciesName: 'Peepal', stock: 150, unitPrice: 50, minOrder: 10, deliveryDays: 3 },
  { supplierId: 'usr-005', speciesId: 'sp-007', speciesName: 'Mango', stock: 80, unitPrice: 80, minOrder: 5, deliveryDays: 5 },
  { supplierId: 'usr-005', speciesId: 'sp-011', speciesName: 'Bamboo', stock: 500, unitPrice: 35, minOrder: 20, deliveryDays: 2 },
  { supplierId: 'usr-005', speciesId: 'sp-005', speciesName: 'Gulmohar', stock: 100, unitPrice: 55, minOrder: 10, deliveryDays: 3 },
  { supplierId: 'usr-006', speciesId: 'sp-001', speciesName: 'Neem', stock: 300, unitPrice: 42, minOrder: 15, deliveryDays: 4 },
  { supplierId: 'usr-006', speciesId: 'sp-002', speciesName: 'Banyan', stock: 50, unitPrice: 60, minOrder: 5, deliveryDays: 5 },
  { supplierId: 'usr-006', speciesId: 'sp-006', speciesName: 'Rain Tree', stock: 120, unitPrice: 70, minOrder: 10, deliveryDays: 4 },
  { supplierId: 'usr-006', speciesId: 'sp-009', speciesName: 'Coconut', stock: 60, unitPrice: 100, minOrder: 5, deliveryDays: 7 },
  { supplierId: 'usr-006', speciesId: 'sp-010', speciesName: 'Tamarind', stock: 80, unitPrice: 65, minOrder: 10, deliveryDays: 4 },
  { supplierId: 'usr-006', speciesId: 'sp-004', speciesName: 'Indian Rosewood', stock: 40, unitPrice: 120, minOrder: 5, deliveryDays: 7 },
  { supplierId: 'usr-006', speciesId: 'sp-008', speciesName: 'Jackfruit', stock: 70, unitPrice: 75, minOrder: 5, deliveryDays: 5 },
];

export const MOCK_ORDERS: SupplyOrder[] = [
  {
    id: 'ord-001', planId: 'plan-001', supplierId: 'usr-005',
    items: [
      { speciesId: 'sp-001', name: 'Neem', quantity: 10 },
      { speciesId: 'sp-003', name: 'Peepal', quantity: 5 },
      { speciesId: 'sp-007', name: 'Mango', quantity: 8 },
      { speciesId: 'sp-011', name: 'Bamboo', quantity: 15 },
    ],
    total: 2575, status: 'delivered', orderedAt: '2026-06-16', deliveredAt: '2026-06-20',
  },
  {
    id: 'ord-002', planId: 'plan-002', supplierId: 'usr-006',
    items: [
      { speciesId: 'sp-006', name: 'Rain Tree', quantity: 8 },
      { speciesId: 'sp-005', name: 'Gulmohar', quantity: 6 },
      { speciesId: 'sp-010', name: 'Tamarind', quantity: 4 },
      { speciesId: 'sp-001', name: 'Neem', quantity: 10 },
    ],
    total: 2640, status: 'processing', orderedAt: '2026-07-20',
  },
];
