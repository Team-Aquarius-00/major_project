-- Remove deprecated result payload columns from Interview.
ALTER TABLE "Interview"
  DROP COLUMN IF EXISTS "feedback",
  DROP COLUMN IF EXISTS "scoring",
  DROP COLUMN IF EXISTS "tracking";
