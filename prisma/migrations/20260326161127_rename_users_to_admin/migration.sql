-- Safely rename the Users table to Admin (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'Users'
  ) THEN
    ALTER TABLE "Users" RENAME TO "Admin";
    
    -- Rename the primary key constraint if it exists
    IF EXISTS (
      SELECT FROM information_schema.table_constraints 
      WHERE constraint_name = 'users_pkey' AND table_name = 'Admin'
    ) THEN
      ALTER TABLE "Admin" RENAME CONSTRAINT "users_pkey" TO "Admin_pkey";
    END IF;
    
    -- Rename the email unique constraint if it exists
    IF EXISTS (
      SELECT FROM information_schema.table_constraints 
      WHERE constraint_name = 'users_email_key' AND table_name = 'Admin'
    ) THEN
      ALTER TABLE "Admin" RENAME CONSTRAINT "users_email_key" TO "Admin_email_key";
    END IF;
  END IF;
END $$;
