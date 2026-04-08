import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { patchStudentOnboardingStep } from '@/lib/admin/student-onboarding-store';
import { jsonError, serverErrorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError('Unauthorized', 401);

    const formData = await request.formData();
    const email = (formData.get('email') as string | null)?.trim();
    if (!email) return jsonError('Email is required', 400);
    const file = formData.get('file') as File | null;
    if (!file) return jsonError('No file provided', 400);

    if (!file.name.endsWith('.docx')) {
      return jsonError('Only .docx files are accepted', 400);
    }

    const emailSlug = email.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const path = `master-resumes/${emailSlug}/${file.name}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await put(path, buffer, {
      access: 'public',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      addRandomSuffix: false,
    });

    // Save URL to onboarding record
    await patchStudentOnboardingStep(email, {
      masterResumeUrl: blob.url,
      masterResumeFileName: file.name,
      currentStep: 7,
      completedSteps: [6],
    });

    return NextResponse.json({ ok: true, url: blob.url, fileName: file.name });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to upload resume.');
  }
}
