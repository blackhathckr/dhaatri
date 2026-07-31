"use client";

import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, iconBg = 'bg-[#D8F3DC]', iconColor = 'text-[#2D6A4F]' }: StatCardProps) {
  return (
    <Card className="border-[#E0DDD6] hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-[#6B7F75]">{title}</p>
            <p className="text-2xl font-extrabold text-[#1B4332] mt-1">{value}</p>
            {subtitle && <p className="text-xs text-[#6B7F75] mt-0.5">{subtitle}</p>}
            {trend && (
              <p className={`text-xs font-semibold mt-2 ${trend.value >= 0 ? 'text-[#40916C]' : 'text-[#C1414A]'}`}>
                {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
