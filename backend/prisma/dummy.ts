import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SENINEL_PREFIX = 'dummy-firebase-';

type HelperSeed = {
  fullName: string;
  serviceType: 'MAID' | 'BABYSITTER' | 'NANNY';
  city: string;
  experienceYears: number;
  avatarUrl: string;
  verified: boolean;
};

const HELPERS: HelperSeed[] = [
  { fullName: 'Lakshmi Devi', serviceType: 'MAID', city: 'Bengaluru', experienceYears: 8, avatarUrl: 'https://i.pravatar.cc/150?img=1', verified: true },
  { fullName: 'Sunita Kumari', serviceType: 'MAID', city: 'Bengaluru', experienceYears: 5, avatarUrl: 'https://i.pravatar.cc/150?img=2', verified: true },
  { fullName: 'Meena Rajan', serviceType: 'MAID', city: 'Hyderabad', experienceYears: 6, avatarUrl: 'https://i.pravatar.cc/150?img=3', verified: true },
  { fullName: 'Parvati Sharma', serviceType: 'MAID', city: 'Delhi', experienceYears: 4, avatarUrl: 'https://i.pravatar.cc/150?img=4', verified: false },
  { fullName: 'Geetha Iyer', serviceType: 'MAID', city: 'Chennai', experienceYears: 9, avatarUrl: 'https://i.pravatar.cc/150?img=5', verified: true },
  { fullName: 'Rekha Nair', serviceType: 'MAID', city: 'Kochi', experienceYears: 7, avatarUrl: 'https://i.pravatar.cc/150?img=6', verified: true },
  { fullName: 'Anjali Verma', serviceType: 'BABYSITTER', city: 'Bengaluru', experienceYears: 3, avatarUrl: 'https://i.pravatar.cc/150?img=7', verified: true },
  { fullName: 'Priya Singh', serviceType: 'BABYSITTER', city: 'Delhi', experienceYears: 4, avatarUrl: 'https://i.pravatar.cc/150?img=8', verified: true },
  { fullName: 'Kavitha Reddy', serviceType: 'BABYSITTER', city: 'Hyderabad', experienceYears: 2, avatarUrl: 'https://i.pravatar.cc/150?img=9', verified: false },
  { fullName: 'Maria Fernandes', serviceType: 'NANNY', city: 'Mumbai', experienceYears: 10, avatarUrl: 'https://i.pravatar.cc/150?img=10', verified: true },
  { fullName: 'Deepa Menon', serviceType: 'NANNY', city: 'Chennai', experienceYears: 6, avatarUrl: 'https://i.pravatar.cc/150?img=11', verified: true },
  { fullName: 'Rashmi Kulkarni', serviceType: 'NANNY', city: 'Pune', experienceYears: 5, avatarUrl: 'https://i.pravatar.cc/150?img=12', verified: false },
];

const HOUSEHOLDS = [
  { fullName: 'Ramesh Gupta', city: 'Bengaluru' },
  { fullName: 'Sheela Desai', city: 'Mumbai' },
  { fullName: 'Arjun Nair', city: 'Hyderabad' },
  { fullName: 'Farida Khan', city: 'Delhi' },
  { fullName: 'Vikram Mehta', city: 'Chennai' },
  { fullName: 'Divya Rao', city: 'Pune' },
];

const AVAILABILITY = {
  mon: ['09:00-13:00'],
  tue: ['09:00-13:00'],
  wed: ['09:00-13:00'],
  thu: ['09:00-13:00'],
  fri: ['09:00-13:00'],
  sat: ['07:00-12:00'],
  sun: ['07:00-12:00'],
};

const REVIEW_SEEDS = [
  { rating: 5, comment: 'Very punctual and thorough. Highly recommended.' },
  { rating: 4, comment: 'Good work, communicates clearly.' },
  { rating: 5, comment: 'Our house has never been cleaner!' },
  { rating: 4, comment: 'Reliable and careful with the children.' },
  { rating: 3, comment: 'Decent, but was late a couple of times.' },
  { rating: 5, comment: 'Wonderful with my toddler, very patient.' },
  { rating: 4, comment: 'Hardworking and honest.' },
  { rating: 4, comment: 'Polite and professional.' },
  { rating: 5, comment: 'Exceeded expectations, will book again.' },
  { rating: 3, comment: 'Average experience overall.' },
  { rating: 5, comment: 'Fantastic cook and helper.' },
  { rating: 4, comment: 'Great with cleaning and organization.' },
];

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

async function main() {
  const existing = await prisma.user.count({ where: { firebaseUid: { startsWith: SENINEL_PREFIX } } });
  if (existing > 0) {
    console.log(`Dummy data already present (${existing} users). Skipping.`);
    await prisma.$disconnect();
    return;
  }

  const helperIds: string[] = [];

  for (let i = 0; i < HELPERS.length; i++) {
    const h = HELPERS[i];
    const password = `dummy-helper-${i + 1}`;
    const user = await prisma.user.create({
      data: {
        firebaseUid: `${SENINEL_PREFIX}helper-${i + 1}`,
        email: `helper${i + 1}@dummy.trustcare.dev`,
        role: 'HELPER',
        onboardingCompleted: true,
        helperProfile: {
          create: {
            fullName: h.fullName,
            phone: `+91 90000 000${i + 1}`,
            serviceType: h.serviceType,
            experienceYears: h.experienceYears,
            bio: `${h.experienceYears}+ years of experience as a ${h.serviceType.toLowerCase()} in ${h.city}.`,
            city: h.city,
            avatarUrl: h.avatarUrl,
            availability: AVAILABILITY,
            verificationStatus: h.verified ? 'VERIFIED' : 'PENDING',
            documents: {
              create: [
                { docType: 'ID_PROOF', url: 'https://res.cloudinary.com/dummy/image/upload/v1/documents/id-proof.jpg', status: h.verified ? 'VERIFIED' : 'PENDING' },
                { docType: 'ADDRESS_PROOF', url: 'https://res.cloudinary.com/dummy/image/upload/v1/documents/address-proof.jpg', status: h.verified ? 'VERIFIED' : 'PENDING' },
              ],
            },
          },
        },
      },
      include: { helperProfile: true },
    });
    helperIds.push(user.helperProfile!.id);
    console.log(`Created helper: ${h.fullName}`);
    void password;
  }

  const householdIds: string[] = [];

  for (let i = 0; i < HOUSEHOLDS.length; i++) {
    const hh = HOUSEHOLDS[i];
    const user = await prisma.user.create({
      data: {
        firebaseUid: `${SENINEL_PREFIX}household-${i + 1}`,
        email: `household${i + 1}@dummy.trustcare.dev`,
        role: 'HOUSEHOLD',
        onboardingCompleted: true,
        householdProfile: {
          create: {
            fullName: hh.fullName,
            phone: `+91 80000 000${i + 1}`,
            address: `${i + 1}${i + 1}0, Main Road`,
            city: hh.city,
            avatarUrl: 'https://i.pravatar.cc/150?img=20',
          },
        },
      },
      include: { householdProfile: true },
    });
    householdIds.push(user.householdProfile!.id);
    console.log(`Created household: ${hh.fullName}`);
  }

  for (const helperId of helperIds) {
    await prisma.servicePlan.create({
      data: {
        helperId,
        planType: 'HOURLY',
        price: 300,
        description: 'Per hour cleaning and household chores.',
      },
    });
    await prisma.servicePlan.create({
      data: {
        helperId,
        planType: 'MONTHLY',
        price: 12000,
        description: 'Daily help for a month, weekdays only.',
      },
    });
    console.log(`Created service plans for helper ${helperId}`);
  }

  const plans = await prisma.servicePlan.findMany({ where: { helperId: { in: helperIds } } });
  const planByHelper = new Map<string, { hourlyId: string; monthlyId: string }>();
  for (const p of plans) {
    const entry = planByHelper.get(p.helperId) ?? { hourlyId: '', monthlyId: '' };
    if (p.planType === 'HOURLY') entry.hourlyId = p.id;
    else entry.monthlyId = p.id;
    planByHelper.set(p.helperId, entry);
  }

  const bookingIds: string[] = [];

  for (let hi = 0; hi < helperIds.length; hi++) {
    const helperId = helperIds[hi];
    const householdId = householdIds[hi % householdIds.length];
    const plansForHelper = planByHelper.get(helperId)!;

    for (let b = 0; b < 2; b++) {
      const booking = await prisma.booking.create({
        data: {
          householdId,
          helperId,
          servicePlanId: b === 0 ? plansForHelper.hourlyId : plansForHelper.monthlyId,
          status: 'COMPLETED',
          scheduledDate: daysAgo(7 + b * 14),
          startTime: '09:00',
          endTime: '13:00',
          notes: 'Dummy completed booking.',
        },
      });
      bookingIds.push(booking.id);
    }

    await prisma.booking.create({
      data: {
        householdId,
        helperId,
        servicePlanId: plansForHelper.hourlyId,
        status: hi % 2 === 0 ? 'PENDING' : 'ONGOING',
        scheduledDate: daysAgo(-1 * (hi + 1)),
        startTime: '09:00',
        endTime: '13:00',
        notes: 'Dummy upcoming booking.',
      },
    });
  }

  const reviewsByHelper = new Map<string, Array<{ rating: number; comment: string | null }>>();

  for (let i = 0; i < bookingIds.length; i++) {
    const bookingId = bookingIds[i];
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { householdId: true, helperId: true },
    });
    if (!booking) continue;
    const seed = REVIEW_SEEDS[i % REVIEW_SEEDS.length];
    await prisma.review.create({
      data: {
        bookingId,
        householdId: booking.householdId,
        helperId: booking.helperId,
        rating: seed.rating,
        comment: seed.comment,
      },
    });
    const list = reviewsByHelper.get(booking.helperId) ?? [];
    list.push({ rating: seed.rating, comment: seed.comment });
    reviewsByHelper.set(booking.helperId, list);
  }

  for (const [helperId, list] of reviewsByHelper) {
    const total = list.reduce((sum, r) => sum + r.rating, 0);
    const avg = Math.round((total / list.length) * 10) / 10;
    await prisma.helperProfile.update({
      where: { id: helperId },
      data: { ratingAvg: avg, ratingCount: list.length },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    helpers: await prisma.helperProfile.count(),
    households: await prisma.householdProfile.count(),
    plans: await prisma.servicePlan.count(),
    bookings: await prisma.booking.count(),
    reviews: await prisma.review.count(),
  };
  console.log('Seeding complete:', counts);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});