-- Add USER to users.role enum (postgres)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'enum_users_role'
          AND e.enumlabel = 'USER'
    ) THEN
        ALTER TYPE enum_users_role ADD VALUE 'USER';
    END IF;
END $$;
