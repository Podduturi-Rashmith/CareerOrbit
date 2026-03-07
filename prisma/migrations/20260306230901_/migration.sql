-- CreateTable
CREATE TABLE "public"."JobListing" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "roleCategory" TEXT NOT NULL,
    "workMode" TEXT,
    "description" TEXT NOT NULL,
    "applyUrl" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobFetchRun" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fetchedCount" INTEGER NOT NULL,
    "newCount" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "JobFetchRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TailoredResume" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "roleCategory" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "generatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TailoredResume_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobListing_roleCategory_idx" ON "public"."JobListing"("roleCategory");

-- CreateIndex
CREATE INDEX "JobListing_postedAt_idx" ON "public"."JobListing"("postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobListing_source_externalId_key" ON "public"."JobListing"("source", "externalId");

-- CreateIndex
CREATE INDEX "TailoredResume_jobId_idx" ON "public"."TailoredResume"("jobId");

-- CreateIndex
CREATE INDEX "TailoredResume_studentEmail_idx" ON "public"."TailoredResume"("studentEmail");

-- AddForeignKey
ALTER TABLE "public"."TailoredResume" ADD CONSTRAINT "TailoredResume_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TailoredResume" ADD CONSTRAINT "TailoredResume_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
