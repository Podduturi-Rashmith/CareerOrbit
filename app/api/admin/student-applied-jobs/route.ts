import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';
import { serverErrorResponse, jsonError } from '@/lib/server/http';
import type { StudentAppliedJobRecord } from '@/lib/admin/student-applied-jobs-store';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = await getMongoDb();
    const docs = await db
      .collection('student_applied_jobs')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const records = docs.map(({ _id, ...rest }) => rest);
    return NextResponse.json({ records });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to load applied jobs.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentId, studentName, applicationId,
      companyName, jobTitle, category, subcategory,
      appliedOn, resumeFileName, resumeFileDataUrl, resumeMimeType,
    } = body;

    if (!studentId || !applicationId || !appliedOn) {
      return jsonError('Missing required fields', 400);
    }

    const record: StudentAppliedJobRecord = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      studentId,
      studentName: studentName ?? '',
      applicationId,
      companyName: companyName ?? '',
      jobTitle: jobTitle ?? '',
      category: category ?? '',
      subcategory: subcategory ?? '',
      appliedOn,
      resumeFileName: resumeFileName ?? '',
      resumeFileDataUrl: resumeFileDataUrl ?? '',
      resumeMimeType: resumeMimeType ?? '',
      createdAt: Date.now(),
    };

    const db = await getMongoDb();
    await db.collection('student_applied_jobs').insertOne(record as never);

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to save applied job.');
  }
}
