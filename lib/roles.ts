import type { UserRole } from '@/data/types';
import {
  TreePine, LayoutDashboard, MapPin, ClipboardList, Truck,
  Users, FlaskConical, Heart, Building2, Shield, Leaf,
  Package, CheckSquare, BarChart3, FileText, Settings,
  Bell, UserCircle, IndianRupee, Award,
} from 'lucide-react';

export const USER_ROLES = {
  CITIZEN: 'citizen',
  DHAATRI_OPS: 'dhaatri_ops',
  SUPPLIER: 'supplier',
  VOLUNTEER: 'volunteer',
  SCIENTIST: 'scientist',
  DONOR: 'donor',
  ORGANISATION: 'organisation',
  ADMIN: 'admin',
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  citizen: 'Citizen',
  dhaatri_ops: 'Dhaatri Ops',
  supplier: 'Supplier',
  volunteer: 'Volunteer',
  scientist: 'Scientist',
  donor: 'Donor',
  organisation: 'Organisation',
  admin: 'Admin',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  citizen: 'bg-[#D8F3DC] text-[#1B4332]',
  dhaatri_ops: 'bg-[#2D6A4F] text-white',
  supplier: 'bg-[#FAEDCD] text-[#8B5E3C]',
  volunteer: 'bg-[#E9F5EE] text-[#40916C]',
  scientist: 'bg-[#E9EDC9] text-[#2D6A4F]',
  donor: 'bg-[#FFDDD2] text-[#C1414A]',
  organisation: 'bg-[#D4E4F7] text-[#1B4332]',
  admin: 'bg-[#1B4332] text-white',
};

export interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
}

export const SIDEBAR_NAV: Record<UserRole, NavItem[]> = {
  citizen: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'My Sites', url: '/sites', icon: MapPin },
    { title: 'My Requests', url: '/requests', icon: ClipboardList },
    { title: 'Notifications', url: '/notifications', icon: Bell },
    { title: 'Profile', url: '/profile', icon: UserCircle },
  ],
  dhaatri_ops: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'All Sites', url: '/sites', icon: MapPin },
    { title: 'Requests', url: '/requests', icon: ClipboardList },
    { title: 'Supply Orders', url: '/supply/orders', icon: Package },
    { title: 'Volunteers', url: '/volunteers/tasks', icon: Users },
    { title: 'Fund Ledger', url: '/donations', icon: IndianRupee },
    { title: 'Notifications', url: '/notifications', icon: Bell },
  ],
  supplier: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Inventory', url: '/supply/inventory', icon: Package },
    { title: 'Orders', url: '/supply/orders', icon: Truck },
    { title: 'Notifications', url: '/notifications', icon: Bell },
    { title: 'Profile', url: '/profile', icon: UserCircle },
  ],
  volunteer: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'My Tasks', url: '/volunteers/tasks', icon: CheckSquare },
    { title: 'Sites', url: '/sites', icon: MapPin },
    { title: 'Notifications', url: '/notifications', icon: Bell },
    { title: 'Profile', url: '/profile', icon: UserCircle },
  ],
  scientist: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Monitoring Review', url: '/science/monitoring-review', icon: BarChart3 },
    { title: 'Species Catalogue', url: '/science/species', icon: Leaf },
    { title: 'Carbon Engine', url: '/science/carbon-engine', icon: FlaskConical },
    { title: 'Advisories', url: '/science/advisories', icon: FileText },
    { title: 'Notifications', url: '/notifications', icon: Bell },
  ],
  donor: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Donate', url: '/donations', icon: Heart },
    { title: 'Receipts', url: '/donations/receipts', icon: FileText },
    { title: 'Notifications', url: '/notifications', icon: Bell },
    { title: 'Profile', url: '/profile', icon: UserCircle },
  ],
  organisation: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Carbon Credits', url: '/carbon-credits', icon: Award },
    { title: 'Purchase Credits', url: '/carbon-credits/purchase', icon: IndianRupee },
    { title: 'Certificates', url: '/carbon-credits/certificates', icon: FileText },
    { title: 'Notifications', url: '/notifications', icon: Bell },
    { title: 'Profile', url: '/profile', icon: Building2 },
  ],
  admin: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Users', url: '/admin/users', icon: Users },
    { title: 'Roles & Access', url: '/admin/roles', icon: Shield },
    { title: 'Sites', url: '/sites', icon: MapPin },
    { title: 'Species', url: '/admin/species-catalogue', icon: Leaf },
    { title: 'Regions', url: '/admin/regions', icon: MapPin },
    { title: 'Content', url: '/admin/content', icon: FileText },
    { title: 'Grievances', url: '/admin/grievances', icon: Shield },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
};

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['citizen', 'dhaatri_ops', 'supplier', 'volunteer', 'scientist', 'donor', 'organisation', 'admin'],
  '/sites': ['citizen', 'dhaatri_ops', 'volunteer', 'scientist', 'admin'],
  '/requests': ['citizen', 'dhaatri_ops', 'admin'],
  '/supply': ['supplier', 'dhaatri_ops', 'admin'],
  '/volunteers': ['volunteer', 'dhaatri_ops', 'admin'],
  '/science': ['scientist', 'dhaatri_ops', 'admin'],
  '/carbon-credits': ['organisation', 'dhaatri_ops', 'admin'],
  '/donations': ['donor', 'dhaatri_ops', 'admin'],
  '/admin': ['admin'],
  '/profile': ['citizen', 'dhaatri_ops', 'supplier', 'volunteer', 'scientist', 'donor', 'organisation', 'admin'],
  '/notifications': ['citizen', 'dhaatri_ops', 'supplier', 'volunteer', 'scientist', 'donor', 'organisation', 'admin'],
  '/settings': ['citizen', 'dhaatri_ops', 'supplier', 'volunteer', 'scientist', 'donor', 'organisation', 'admin'],
};
