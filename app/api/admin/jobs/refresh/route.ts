import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAdminUser } from '@/lib/auth/require-admin';
import { fetchMockJobsSnapshot } from '@/lib/jobs/mock-provider';

export const runtime = 'nodejs';

export async function POST() {
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const run = await prisma.jobFetchRun.create({
    data: {
      provider: 'mock-job-scout',
      status: 'running',
      fetchedCount: 0,
      newCount: 0,
    },
  });

  try {
    const incoming = await fetchMockJobsSnapshot();
    let newCount = 0;

    for (const item of incoming) {
      const existing = await prisma.jobListing.findUnique({
        where: {
          source_externalId: {
            source: item.source,
            externalId: item.externalId,
          },
        },
      });

      if (!existing) {
        newCount += 1;
      }

      await prisma.jobListing.upsert({
        where: {
          source_externalId: {
            source: item.source,
            externalId: item.externalId,
          },
        },
        update: {
          title: item.title,
          company: item.company,
          location: item.location,
          roleCategory: item.roleCategory,
          workMode: item.workMode,
          description: item.description,
          applyUrl: item.applyUrl,
          postedAt: item.postedAt,
          fetchedAt: new Date(),
          isNew: !existing,
        },
        create: {
          source: item.source,
          externalId: item.externalId,
          title: item.title,
          company: item.company,
          location: item.location,
          roleCategory: item.roleCategory,
          workMode: item.workMode,
          description: item.description,
          applyUrl: item.applyUrl,
          postedAt: item.postedAt,
          fetchedAt: new Date(),
          isNew: true,
        },
      });
    }

    await prisma.jobFetchRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        fetchedCount: incoming.length,
        newCount,
        finishedAt: new Date(),
      },
    });

    const jobs = await prisma.jobListing.findMany({
      orderBy: [{ postedAt: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    return NextResponse.json({ jobs, meta: { fetchedCount: incoming.length, newCount } });
  } catch (error) {
    await prisma.jobFetchRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json({ error: 'Failed to refresh jobs.' }, { status: 500 });
  }
}
