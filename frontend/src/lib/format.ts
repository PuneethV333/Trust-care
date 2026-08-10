import type { PlanType } from '../types';

export function planPrice(planType: PlanType, price: number): string {
  const suffix = planType === 'HOURLY' ? '/hr' : planType === 'MONTHLY' ? '/mo' : '/yr';
  return `₹${price}${suffix}`;
}