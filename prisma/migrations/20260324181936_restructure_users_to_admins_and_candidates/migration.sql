/*
  Warnings:

  - You are about to drop the column `final_score` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `userEmail` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "final_score",
DROP COLUMN "userEmail",
DROP COLUMN "user_id",
ADD COLUMN     "admin_id" INTEGER;

-- DropTable
DROP TABLE "Users";

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "picture" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewCandidate" (
    "id" SERIAL NOT NULL,
    "interview_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "final_score" DOUBLE PRECISION DEFAULT 0,
    "answer_quality_score" DOUBLE PRECISION DEFAULT 0,
    "tracking_score" DOUBLE PRECISION DEFAULT 0,
    "answers" JSONB,
    "evaluation" JSONB,
    "feedback" JSONB,
    "scoring" JSONB,
    "tracking" JSONB,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "InterviewCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "InterviewCandidate_interview_id_idx" ON "InterviewCandidate"("interview_id");

-- CreateIndex
CREATE INDEX "InterviewCandidate_email_idx" ON "InterviewCandidate"("email");

-- CreateIndex
CREATE INDEX "Interview_admin_id_idx" ON "Interview"("admin_id");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewCandidate" ADD CONSTRAINT "InterviewCandidate_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
