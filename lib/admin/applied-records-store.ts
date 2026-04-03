import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import { createEntityId } from '@/lib/shared/id';

const COLLECTION = 'admin_applied_records';

export type AdminAppliedRecord = {
  _id?: ObjectId;
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  category: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  draftId: string;
  draftFileName: string;
  appliedOn: string;
  notes: string;
  createdAt: number;
};

export async function createAdminAppliedRecord(
  input: Omit<AdminAppliedRecord, 'id' | 'createdAt'>
): Promise<AdminAppliedRecord> {
  const db = await getMongoDb();
  const col = db.collection<AdminAppliedRecord>(COLLECTION);
  const next: AdminAppliedRecord = {
    ...input,
    id: createEntityId(),
    createdAt: Date.now(),
  };
  await col.insertOne(next);
  return next;
}

export async function listAdminAppliedRecords(): Promise<AdminAppliedRecord[]> {
  const db = await getMongoDb();
  const col = db.collection<AdminAppliedRecord>(COLLECTION);
  return col.find({}).sort({ createdAt: -1 }).toArray();
}
