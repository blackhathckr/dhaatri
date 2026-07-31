export type UserRole = 'citizen' | 'dhaatri_ops' | 'supplier' | 'volunteer' | 'scientist' | 'donor' | 'organisation' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  location: string;
  avatar?: string;
}

export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  kannadaName: string;
  co2PerYear: number;
  survivalRate: number;
  saplingCost: number;
  growthRate: 'Very Fast' | 'Fast' | 'Medium' | 'Slow';
  suitableSoil: string;
  waterNeed: 'Low' | 'Medium' | 'High';
}

export interface Region {
  id: string;
  region: string;
  locality: string;
  pincode: string;
  zone: string;
}

export type SiteStatus = 'pending' | 'assessed' | 'planned' | 'approved' | 'fulfilled' | 'active' | 'completed';

export interface PlantationSite {
  id: string;
  name: string;
  ownerId: string;
  latitude: number;
  longitude: number;
  area: number;
  status: SiteStatus;
  soilType: string;
  sunlight: string;
  waterAccess: string;
}

export type RequestStatus =
  | 'pending' | 'assigned' | 'assessment_scheduled' | 'assessment_complete'
  | 'plan_ready' | 'plan_review' | 'approved' | 'order_placed'
  | 'delivered' | 'planting_scheduled' | 'planted' | 'monitoring' | 'completed';

export type EngagementModel = 'paid' | 'stewardship';

export interface PlantationRequest {
  id: string;
  siteId: string;
  requesterId: string;
  status: RequestStatus;
  model: EngagementModel;
  createdAt: string;
  updatedAt: string;
}

export interface SiteAssessment {
  id: string;
  siteId: string;
  volunteerId: string;
  date: string;
  soilPh: number;
  soilType: string;
  areaConfirmed: number;
  sunlightHours: string;
  waterSource: string;
  obstacles: string;
  photos: number;
  status: 'pending' | 'completed';
}

export interface PlanSpecies {
  speciesId: string;
  name: string;
  quantity: number;
}

export interface PlantationPlan {
  id: string;
  siteId: string;
  createdById: string;
  species: PlanSpecies[];
  method: 'Miyawaki' | 'Standard' | 'Mixed';
  layout: string;
  estimatedCo2PerYear: number;
  cost: number;
  status: 'draft' | 'review' | 'approved';
  version: string;
}

export interface SupplierInventory {
  supplierId: string;
  speciesId: string;
  speciesName: string;
  stock: number;
  unitPrice: number;
  minOrder: number;
  deliveryDays: number;
}

export type OrderStatus = 'processing' | 'dispatched' | 'delivered' | 'cancelled';

export interface SupplyOrder {
  id: string;
  planId: string;
  supplierId: string;
  items: PlanSpecies[];
  total: number;
  status: OrderStatus;
  orderedAt: string;
  deliveredAt?: string;
}

export interface MonitoringCheckIn {
  id: string;
  siteId: string;
  userId: string;
  date: string;
  survivalCount: number;
  totalTrees: number;
  survivalPercent: number;
  photos: number;
  geoTagged: boolean;
  notes: string;
  status: 'pending_review' | 'verified' | 'flagged';
}

export type CarbonCreditStatus = 'pending' | 'active' | 'retired';

export interface CarbonCredit {
  id: string;
  organisationId: string;
  credits: number;
  amount: number;
  siteIds: string[];
  purchasedAt: string;
  certificateId?: string;
  status: CarbonCreditStatus;
}

export type DonationStatus = 'pending' | 'completed' | 'refunded';

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  amount: number;
  purpose: string;
  siteId?: string;
  date: string;
  receiptId?: string;
  status: DonationStatus;
}

export type TransactionType = 'inflow' | 'outflow';
export type TransactionCategory = 'sapling_payment' | 'donation' | 'carbon_credit' | 'supplier_payment' | 'operations' | 'logistics';

export interface FundTransaction {
  id: string;
  type: TransactionType;
  source: string;
  amount: number;
  purpose: string;
  siteId?: string;
  date: string;
  category: TransactionCategory;
}

export type VolunteerTaskType = 'site_assessment' | 'inspection' | 'data_collection' | 'planting_support';
export type VolunteerTaskStatus = 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface VolunteerTask {
  id: string;
  volunteerId: string;
  type: VolunteerTaskType;
  siteId: string;
  status: VolunteerTaskStatus;
  dueDate: string;
  notes: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
}

export type AdvisoryType = 'care' | 'growth' | 'soil' | 'pest' | 'general';
export type AdvisoryStatus = 'draft' | 'published';

export interface ScientistAdvisory {
  id: string;
  scientistId: string;
  siteId: string;
  date: string;
  type: AdvisoryType;
  title: string;
  content: string;
  status: AdvisoryStatus;
}
