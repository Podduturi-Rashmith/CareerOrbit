import { NextResponse } from 'next/server';
import { listAllResumes, deleteResume, uploadResume } from '@/lib/blob/resume-storage';
import { jsonError, serverErrorResponse } from '@/lib/server/http';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const files = await listAllResumes();

    // Group by studentEmail → jobFolder
    const studentMap = new Map<
      string,
      {
        studentEmail: string;
        jobs: Map<string, { jobFolder: string; companyName: string; jobTitle: string; files: typeof files }>
      }
    >();

    for (const file of files) {
      if (!studentMap.has(file.studentEmail)) {
        studentMap.set(file.studentEmail, { studentEmail: file.studentEmail, jobs: new Map() });
      }
      const student = studentMap.get(file.studentEmail)!;
      if (!student.jobs.has(file.jobFolder)) {
        student.jobs.set(file.jobFolder, {
          jobFolder: file.jobFolder,
          companyName: file.companyName,
          jobTitle: file.jobTitle,
          files: [],
        });
      }
      student.jobs.get(file.jobFolder)!.files.push(file);
    }

    const students = Array.from(studentMap.values()).map((s) => ({
      studentEmail: s.studentEmail,
      jobs: Array.from(s.jobs.values()).map((j) => ({
        ...j,
        files: j.files.map((f) => ({
          url: f.url,
          pathname: f.pathname,
          filename: f.filename,
          uploadedAt: f.uploadedAt.toISOString(),
          size: f.size,
        })),
      })),
    }));

    return NextResponse.json({ students });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to list files.');
  }
}

export async function DELETE(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return jsonError('url is required', 400);
    }
    await deleteResume(url);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to delete file.');
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const studentEmail = formData.get('studentEmail') as string;
    const companyName = formData.get('companyName') as string;
    const jobTitle = formData.get('jobTitle') as string;

    if (!file || !studentEmail || !companyName || !jobTitle) {
      return jsonError('file, studentEmail, companyName, jobTitle are required', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadResume(studentEmail, companyName, jobTitle, file.name, buffer);

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    return serverErrorResponse(error, 'Failed to upload file.');
  }
}
