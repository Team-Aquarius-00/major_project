-- CreateTable
CREATE TABLE "Interview" (
    "id" SERIAL NOT NULL,
    "interview_id" TEXT NOT NULL,
    "job_position" TEXT,
    "job_description" TEXT,
    "duration" TEXT,
    "questionList" JSONB,
    "userEmail" TEXT,
    "completed" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "feedback" JSONB,
    "scoring" JSONB,
    "tracking" JSONB,
    "type" TEXT[],
    "user_id" INTEGER,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "picture" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Interview_interview_id_key" ON "Interview"("interview_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "Users"("email");
