-- CreateEnum
CREATE TYPE "UpcomingEventType" AS ENUM ('SCREENING', 'INTERVIEW', 'ASSESSMENT');

-- AlterTable
ALTER TABLE "Application"
ADD COLUMN "meetingLink" TEXT,
ADD COLUMN "prepNotes" TEXT,
ADD COLUMN "upcomingEventDate" TIMESTAMP(3),
ADD COLUMN "upcomingEventType" "UpcomingEventType";
