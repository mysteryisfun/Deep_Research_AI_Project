-- Add password_updated_at column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Update the handle_new_user function to include password_updated_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, username, password_updated_at)
    VALUES (new.id, new.email, split_part(new.email, '@', 1), timezone('utc'::text, now()));
    
    INSERT INTO public.profiles (id, email, username)
    VALUES (new.id, new.email, split_part(new.email, '@', 1));
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update password_updated_at when password is changed
CREATE OR REPLACE FUNCTION public.handle_password_change()
RETURNS trigger AS $$
BEGIN
    -- This function will be called by a trigger when a user's password is changed
    -- The actual password is stored in auth.users, not in our public.users table
    -- We just track when it was last updated
    NEW.password_updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger for password changes
-- Note: This is a placeholder. In Supabase, password changes are handled by auth.updateUser
-- We'll update this timestamp manually in our application code when passwords are changed 