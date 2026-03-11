import { NextResponse } from 'next/server';
import { JobFetchRun, JobListing, connectToDatabase } from '@/lib/server/mongodb';
import { requireAdminUser } from '@/lib/auth/require-admin';
import { fetchMockJobsSnapshot } from '@/lib/jobs/mock-provider';
import { fetchRapidApiJobsSnapshot } from '@/lib/jobs/rapidapi-provider';

export const runtime = 'nodejs';

export async function POST() {
  await connectToDatabase();
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const run = await JobFetchRun.create({
    provider: process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_HOST ? 'rapidapi-glassdoor' : 'mock-job-scout',
    status: 'running',
    fetchedCount: 0,
    newCount: 0,
    startedAt: new Date(),
  });

  try {
    const rapid = await fetchRapidApiJobsSnapshot();
    const incoming = rapid.enabled ? rapid.jobs : await fetchMockJobsSnapshot();
    let newCount = 0;

    for (const item of incoming) {
      const existing = await JobListing.findOne({ source: item.source, externalId: item.externalId }).lean();

      if (!existing) {
        newCount += 1;
      }

      await JobListing.updateOne(
        { source: item.source, externalId: item.externalId },
        {
          $set: {
            title: item.title,
            company: item.company,
            location: item.location,
            roleCategory: item.roleCategory,
            workMode: item.workMode,
            description: item.description,
            applyUrl: item.applyUrl,
            postedAt: item.postedAt,
            fetchedAt: new Date(),
            isFresh: !existing,
          },
          $setOnInsert: {
            source: item.source,
            externalId: item.externalId,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    await JobFetchRun.updateOne(
      { _id: run._id },
      { $set: { status: 'completed', fetchedCount: incoming.length, newCount, finishedAt: new Date() } }
    );

    const jobs = await JobListing.find({}).sort({ postedAt: -1, createdAt: -1 }).limit(50).lean();

    return NextResponse.json({
      jobs: jobs.map((job) => {
        const { _id, isFresh, ...rest } = job as { _id: { toString(): string }; isFresh?: boolean } & Record<string, unknown>;
        return {
          ...rest,
          id: _id.toString(),
          isNew: Boolean(isFresh),
        };
      }),
      meta: {
        fetchedCount: incoming.length,
        newCount,
        provider: rapid.enabled ? 'rapidapi-glassdoor' : 'mock-job-scout',
        roleStats: rapid.enabled ? rapid.roleStats : undefined,
        targetPerRole: rapid.enabled ? rapid.targetPerRole : undefined,
      },
    });
  } catch (error) {
    await JobFetchRun.updateOne(
      { _id: run._id },
      { $set: { status: 'failed', finishedAt: new Date(), error: error instanceof Error ? error.message : 'Unknown error' } }
    );

    return NextResponse.json({ error: 'Failed to refresh jobs.' }, { status: 500 });
  }
}
