import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAdminUser } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const q = searchParams.get('q');

  const jobs = await prisma.jobListing.findMany({
    where: {
      roleCategory: role && role !== 'all' ? role : undefined,
      OR: q
        ? [
            { title: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ]
        : undefined,
    },
    orderBy: [{ postedAt: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  });

  return NextResponse.json({ jobs });
}
