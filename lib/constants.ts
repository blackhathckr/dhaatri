export const APP_NAME = 'Dhaatri';
export const APP_TAGLINE = 'Plant a Tree. Track its Growth. Measure Your Impact.';
export const APP_DESCRIPTION = 'A national public platform for citizen-driven plantation and carbon footprint reduction.';

export const SITE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assessed: 'Assessed',
  planned: 'Planned',
  approved: 'Approved',
  fulfilled: 'Fulfilled',
  active: 'Active',
  completed: 'Completed',
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  assessment_scheduled: 'Assessment Scheduled',
  assessment_complete: 'Assessment Complete',
  plan_ready: 'Plan Ready',
  plan_review: 'Plan Review',
  approved: 'Approved',
  order_placed: 'Order Placed',
  delivered: 'Delivered',
  planting_scheduled: 'Planting Scheduled',
  planted: 'Planted',
  monitoring: 'Monitoring',
  completed: 'Completed',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-[#FAEDCD] text-[#8B5E3C]',
  assigned: 'bg-[#D4E4F7] text-[#1B4332]',
  assessment_scheduled: 'bg-[#D4E4F7] text-[#1B4332]',
  assessment_complete: 'bg-[#E9F5EE] text-[#40916C]',
  plan_ready: 'bg-[#E9EDC9] text-[#2D6A4F]',
  plan_review: 'bg-[#FAEDCD] text-[#8B5E3C]',
  approved: 'bg-[#D8F3DC] text-[#1B4332]',
  order_placed: 'bg-[#D4E4F7] text-[#1B4332]',
  delivered: 'bg-[#E9F5EE] text-[#40916C]',
  planting_scheduled: 'bg-[#E9EDC9] text-[#2D6A4F]',
  planted: 'bg-[#D8F3DC] text-[#2D6A4F]',
  monitoring: 'bg-[#52B788] text-white',
  completed: 'bg-[#2D6A4F] text-white',
  active: 'bg-[#52B788] text-white',
  assessed: 'bg-[#E9F5EE] text-[#40916C]',
  planned: 'bg-[#E9EDC9] text-[#2D6A4F]',
  fulfilled: 'bg-[#D8F3DC] text-[#1B4332]',
  processing: 'bg-[#FAEDCD] text-[#8B5E3C]',
  dispatched: 'bg-[#D4E4F7] text-[#1B4332]',
  cancelled: 'bg-[#FFDDD2] text-[#C1414A]',
  draft: 'bg-[#E0DDD6] text-[#6B7F75]',
  review: 'bg-[#FAEDCD] text-[#8B5E3C]',
  published: 'bg-[#2D6A4F] text-white',
  verified: 'bg-[#D8F3DC] text-[#2D6A4F]',
  pending_review: 'bg-[#FAEDCD] text-[#8B5E3C]',
  flagged: 'bg-[#FFDDD2] text-[#C1414A]',
  in_progress: 'bg-[#D4E4F7] text-[#1B4332]',
  retired: 'bg-[#E0DDD6] text-[#6B7F75]',
};

export const MASCOT_POSES = {
  waving: '/mascot/sprout-waving.png',
  celebrating: '/mascot/sprout-celebrating.png',
  thinking: '/mascot/sprout-thinking.png',
  planting: '/mascot/sprout-planting.png',
  sleeping: '/mascot/sprout-sleeping.png',
  sad: '/mascot/sprout-sad.png',
  pointing: '/mascot/sprout-pointing.png',
  reading: '/mascot/sprout-reading.png',
  watering: '/mascot/sprout-watering.png',
  holdingPhone: '/mascot/sprout-holding-phone.png',
} as const;
