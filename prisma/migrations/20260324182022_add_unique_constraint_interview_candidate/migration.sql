/*
  Warnings:

  - A unique constraint covering the columns `[interview_id,email]` on the table `InterviewCandidate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "InterviewCandidate_interview_id_email_key" ON "InterviewCandidate"("interview_id", "email");
