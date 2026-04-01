import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import { createEntityId } from '@/lib/shared/id';

const COLLECTION = 'tailored_resume_drafts';

export type TailoredResumeDraftRecord = {
  _id?: ObjectId;
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  category: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  masterResumeFileName: string;
  content: string;
  createdAt: number;
};

export async function createTailoredResumeDraft(
  input: Omit<TailoredResumeDraftRecord, 'id' | 'createdAt'>
): Promise<TailoredResumeDraftRecord> {
  const db = await getMongoDb();
  const col = db.collection<TailoredResumeDraftRecord>(COLLECTION);
  const next: TailoredResumeDraftRecord = {
    ...input,
    id: createEntityId(),
    createdAt: Date.now(),
  };
  await col.insertOne(next);
  return next;
}

export async function getTailoredResumeDraftById(id: string): Promise<TailoredResumeDraftRecord | null> {
  const db = await getMongoDb();
  const col = db.collection<TailoredResumeDraftRecord>(COLLECTION);
  return col.findOne({ id });
}

export async function listTailoredResumeDrafts(limit = 50): Promise<TailoredResumeDraftRecord[]> {
  const db = await getMongoDb();
  const col = db.collection<TailoredResumeDraftRecord>(COLLECTION);
  return col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
}
