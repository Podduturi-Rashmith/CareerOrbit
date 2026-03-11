import { NextResponse } from 'next/server';
import { JobListing, connectToDatabase } from '@/lib/server/mongodb';
import { requireAdminUser } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  await connectToDatabase();
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const q = searchParams.get('q');

  const filter: Record<string, unknown> = {};
  if (role && role !== 'all') filter.roleCategory = role;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
  }

  const jobs = await JobListing.find(filter).sort({ postedAt: -1, createdAt: -1 }).limit(50).lean();

  return NextResponse.json({
    jobs: jobs.map((job) => {
      const { _id, isFresh, ...rest } = job as { _id: { toString(): string }; isFresh?: boolean } & Record<string, unknown>;
      return {
        ...rest,
        id: _id.toString(),
        isNew: Boolean(isFresh),
      };
    }),
  });
}
