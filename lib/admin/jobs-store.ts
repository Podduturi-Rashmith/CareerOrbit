import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import type { ApplicationCategory } from '@/lib/admin/applications-store';
import { createEntityId } from '@/lib/shared/id';

const COLLECTION = 'admin_jobs';

export type AdminJobRecord = {
  _id?: ObjectId;
  id: string;
  companyName: string;
  category: ApplicationCategory;
  subcategory: string;
  jobTitle: string;
  jobDescription: string;
  jobLink?: string;
  date: string;
  studentId: string;
  studentName: string;
  createdAt: number;
};

export async function listAdminJobs(): Promise<AdminJobRecord[]> {
  const db = await getMongoDb();
  const col = db.collection<AdminJobRecord>(COLLECTION);
  return col.find({}).sort({ createdAt: -1 }).toArray();
}

export async function createAdminJob(
  input: Omit<AdminJobRecord, 'id' | 'createdAt'>
): Promise<AdminJobRecord> {
  const db = await getMongoDb();
  const col = db.collection<AdminJobRecord>(COLLECTION);
  const next: AdminJobRecord = {
    ...input,
    id: createEntityId(),
    createdAt: Date.now(),
  };
  await col.insertOne(next);
  return next;
}

export async function getAdminJobById(id: string): Promise<AdminJobRecord | null> {
  const db = await getMongoDb();
  const col = db.collection<AdminJobRecord>(COLLECTION);
  return col.findOne({ id });
}

export async function updateAdminJob(
  id: string,
  updates: Partial<
    Pick<
      AdminJobRecord,
      'companyName' | 'category' | 'subcategory' | 'jobTitle' | 'jobDescription' | 'jobLink' | 'date'
    >
  >
): Promise<AdminJobRecord | null> {
  const db = await getMongoDb();
  const col = db.collection<AdminJobRecord>(COLLECTION);
  await col.updateOne({ id }, { $set: updates });
  return col.findOne({ id });
}
