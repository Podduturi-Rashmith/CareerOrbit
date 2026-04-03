import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import { createEntityId } from '@/lib/shared/id';

const COLLECTION = 'student_master_resumes';

export type StudentMasterResumeRecord = {
  _id?: ObjectId;
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  fileName: string;
  mimeType: string;
  fileDataUrl: string;
  extractedText: string;
  uploadedAt: number;
  updatedAt: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function upsertStudentMasterResume(
  input: Omit<StudentMasterResumeRecord, 'id' | 'uploadedAt' | 'updatedAt'>
): Promise<StudentMasterResumeRecord> {
  const db = await getMongoDb();
  const col = db.collection<StudentMasterResumeRecord>(COLLECTION);
  const now = Date.now();
  const studentEmail = normalizeEmail(input.studentEmail);
  const existing = await col.findOne({ studentEmail });
  const next: StudentMasterResumeRecord = {
    ...input,
    studentEmail,
    id: existing?.id || createEntityId(),
    uploadedAt: existing?.uploadedAt || now,
    updatedAt: now,
  };
  await col.updateOne({ studentEmail }, { $set: next }, { upsert: true });
  return next;
}

export async function getStudentMasterResumeByEmail(email: string): Promise<StudentMasterResumeRecord | null> {
  const db = await getMongoDb();
  const col = db.collection<StudentMasterResumeRecord>(COLLECTION);
  return col.findOne({ studentEmail: normalizeEmail(email) });
}
