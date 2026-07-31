"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MASCOT_POSES } from '@/lib/constants';

interface EmptyStateProps {
  title: string;
  description: string;
  mascotPose?: keyof typeof MASCOT_POSES;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, mascotPose = 'thinking', actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-32 h-32 mb-6 relative">
        <Image
          src={MASCOT_POSES[mascotPose]}
          alt="Sprout mascot"
          fill
          className="object-contain"
        />
      </div>
      <h3 className="text-lg font-bold text-[#1B4332] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7F75] max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-[#2D6A4F] hover:bg-[#1B4332]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
