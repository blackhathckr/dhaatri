"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MASCOT_POSES } from '@/lib/constants';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-32 h-32 mb-6 relative">
        <Image
          src={MASCOT_POSES.sad}
          alt="Sprout mascot sad"
          fill
          className="object-contain"
        />
      </div>
      <h3 className="text-lg font-bold text-[#1B4332] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7F75] max-w-sm mb-6">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="border-[#2D6A4F] text-[#2D6A4F]">
          Try Again
        </Button>
      )}
    </div>
  );
}
