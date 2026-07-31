"use client";

import { useAuthContext } from "@/components/shared/auth-provider";
import { CitizenDashboard } from "@/components/features/dashboard/citizen-dashboard";
import { OpsDashboard } from "@/components/features/dashboard/ops-dashboard";
import { SupplierDashboard } from "@/components/features/dashboard/supplier-dashboard";
import { VolunteerDashboard } from "@/components/features/dashboard/volunteer-dashboard";
import { ScientistDashboard } from "@/components/features/dashboard/scientist-dashboard";
import { DonorDashboard } from "@/components/features/dashboard/donor-dashboard";
import { OrgDashboard } from "@/components/features/dashboard/org-dashboard";
import { AdminDashboard } from "@/components/features/dashboard/admin-dashboard";

const DASHBOARD_MAP = {
  citizen: CitizenDashboard,
  dhaatri_ops: OpsDashboard,
  supplier: SupplierDashboard,
  volunteer: VolunteerDashboard,
  scientist: ScientistDashboard,
  donor: DonorDashboard,
  organisation: OrgDashboard,
  admin: AdminDashboard,
} as const;

export default function DashboardPage() {
  const { currentUser } = useAuthContext();
  // Each dashboard carries its own scene hero, so no page header above it.
  const DashboardComponent = DASHBOARD_MAP[currentUser.role];
  return <DashboardComponent />;
}
