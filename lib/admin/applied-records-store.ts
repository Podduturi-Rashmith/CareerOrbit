import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import { createEntityId } from '@/lib/shared/id';
import type { ApplicationUiStatus, CalendarEventType } from '@/lib/applications/serialize';

const COLLECTION = 'admin_applied_records';

export type AppliedRecordUpcomingEvent = {
  type: CalendarEventType;
  date: string; // ISO datetime string
  meetingLink?: string;
  prepNotes?: string;
};

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
  // Status tracking (set by admin)
  status?: ApplicationUiStatus;
  upcomingEvent?: AppliedRecordUpcomingEvent;
  // Blob URL saved when admin downloads the tailored resume
  resumeBlobUrl?: string;
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

export async function listAdminAppliedRecordsByEmail(
  email: string
): Promise<AdminAppliedRecord[]> {
  const key = email.trim().toLowerCase();
  if (!key) return [];
  const db = await getMongoDb();
  const col = db.collection<AdminAppliedRecord>(COLLECTION);
  return col
    .find({ studentEmail: { $regex: `^${key}$`, $options: 'i' } })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getAdminAppliedRecordById(
  id: string
): Promise<AdminAppliedRecord | null> {
  const db = await getMongoDb();
  const col = db.collection<AdminAppliedRecord>(COLLECTION);
  return col.findOne({ id });
}

export async function updateAdminAppliedRecord(
  id: string,
  updates: Partial<Pick<AdminAppliedRecord, 'status' | 'upcomingEvent' | 'notes'>>
): Promise<AdminAppliedRecord | null> {
  const db = await getMongoDb();
  const col = db.collection<AdminAppliedRecord>(COLLECTION);
  await col.updateOne({ id }, { $set: updates });
  return col.findOne({ id });
}
