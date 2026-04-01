import { describe, expect, it } from 'vitest';
import {
  AdminAppliedRecordPayloadSchema,
  AdminJobPayloadSchema,
  MasterResumePayloadSchema,
  TailorRequestPayloadSchema,
} from '@/lib/admin/schemas';

describe('admin schema validation', () => {
  it('validates a job payload', () => {
    const parsed = AdminJobPayloadSchema.safeParse({
      companyName: 'Acme',
      category: 'Software Engineering',
      subcategory: 'Backend Developer',
      jobTitle: 'Backend Engineer',
      jobDescription: 'Build APIs',
      jobLink: 'https://example.com/job',
      date: '2026-03-30',
      studentId: 'unassigned',
      studentName: 'Unassigned',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid job category', () => {
    const parsed = AdminJobPayloadSchema.safeParse({
      companyName: 'Acme',
      category: 'InvalidCategory',
      subcategory: 'Backend Developer',
      jobTitle: 'Backend Engineer',
      jobDescription: 'Build APIs',
      date: '2026-03-30',
    });
    expect(parsed.success).toBe(false);
  });

  it('requires core fields for applied records', () => {
    const parsed = AdminAppliedRecordPayloadSchema.safeParse({
      jobId: '',
      studentEmail: '',
      draftId: '',
      appliedOn: '',
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts a master resume payload', () => {
    const parsed = MasterResumePayloadSchema.safeParse({
      studentId: 's-1',
      studentName: 'Student One',
      studentEmail: 'student@example.com',
      fileName: 'resume.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileDataUrl: 'data:text/plain;base64,dGVzdA==',
      extractedText: '',
    });
    expect(parsed.success).toBe(true);
  });

  it('requires studentEmail for tailor requests', () => {
    const parsed = TailorRequestPayloadSchema.safeParse({
      studentEmail: '',
    });
    expect(parsed.success).toBe(false);
  });
});
