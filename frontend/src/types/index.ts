export const ROLE_VALUES = ['HOUSEHOLD', 'HELPER', 'ADMIN'] as const;
export type Role = (typeof ROLE_VALUES)[number];

export const SERVICE_TYPE_VALUES = ['MAID', 'BABYSITTER', 'NANNY'] as const;
export type ServiceType = (typeof SERVICE_TYPE_VALUES)[number];

export const PLAN_TYPE_VALUES = ['HOURLY', 'MONTHLY', 'YEARLY'] as const;
export type PlanType = (typeof PLAN_TYPE_VALUES)[number];

export const DAY_VALUES = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;
export type Day = (typeof DAY_VALUES)[number];

export const TIME_SLOT_VALUES = ['morning', 'afternoon', 'evening'] as const;
export type TimeSlot = (typeof TIME_SLOT_VALUES)[number];

export const VERIFICATION_STATUS_VALUES = ['PENDING', 'VERIFIED', 'REJECTED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS_VALUES)[number];

export const DISPUTE_STATUS_VALUES = [
  'OPEN',
  'IN_REVIEW',
  'RESOLVED',
  'DISMISSED',
] as const;
export type DisputeStatus = (typeof DISPUTE_STATUS_VALUES)[number];

export const BOOKING_STATUS_VALUES = [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
] as const;
export type BookingStatus = (typeof BOOKING_STATUS_VALUES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  HOUSEHOLD: 'Household',
  HELPER: 'Helper',
  ADMIN: 'Admin',
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  MAID: 'Maid',
  BABYSITTER: 'Babysitter',
  NANNY: 'Nanny',
};

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  HOURLY: 'Hourly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};

export const DAY_LABELS: Record<Day, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  OPEN: 'Open',
  IN_REVIEW: 'In review',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
