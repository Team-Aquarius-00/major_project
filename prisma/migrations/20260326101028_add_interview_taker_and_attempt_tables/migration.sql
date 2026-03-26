-- CreateTable
CREATE TABLE "InterviewTaker" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "picture" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewTaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewAttempt" (
    "id" SERIAL NOT NULL,
    "interview_id" INTEGER NOT NULL,
    "interview_taker_id" INTEGER NOT NULL,
    "started_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "completed" BOOLEAN DEFAULT false,
    "feedback" JSONB,
    "scoring" JSONB,
    "tracking" JSONB,

    CONSTRAINT "InterviewAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewTaker_email_key" ON "InterviewTaker"("email");

-- CreateIndex
CREATE INDEX "InterviewAttempt_interview_id_idx" ON "InterviewAttempt"("interview_id");

-- CreateIndex
CREATE INDEX "InterviewAttempt_interview_taker_id_idx" ON "InterviewAttempt"("interview_taker_id");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAttempt" ADD CONSTRAINT "InterviewAttempt_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAttempt" ADD CONSTRAINT "InterviewAttempt_interview_taker_id_fkey" FOREIGN KEY ("interview_taker_id") REFERENCES "InterviewTaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
