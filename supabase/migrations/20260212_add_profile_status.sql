-- Migration to add availability and last_active_at to profiles table

DO $$ 
BEGIN
    -- Add availability column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'availability') THEN
        ALTER TABLE profiles ADD COLUMN availability text DEFAULT 'none';
        -- Optional: Add check constraint
        -- ALTER TABLE profiles ADD CONSTRAINT availability_check CHECK (availability IN ('gigs', 'band', 'none'));
    END IF;

    -- Add last_active_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_active_at') THEN
        ALTER TABLE profiles ADD COLUMN last_active_at timestamptz DEFAULT now();
    END IF;
END $$;
