# Authentication System

This document explains the authentication system used in the application.

## Overview

The application uses Supabase for authentication. The authentication system ensures that:

1. Only the most recent password is stored for each account
2. The login process properly verifies both email and password before allowing entry
3. Password changes are tracked with timestamps

## Database Schema

The authentication system uses the following tables:

- `auth.users`: Managed by Supabase, stores user authentication data including hashed passwords
- `public.users`: Application-specific user data, linked to `auth.users` by ID
- `public.profiles`: User profile information, linked to `auth.users` by ID

## Password Management

### Password Storage

- Passwords are never stored in plain text
- Passwords are hashed and stored in the Supabase `auth.users` table
- Only the most recent password is stored for each account
- Password changes are tracked with a timestamp in the `public.users` table

### Password Change Process

When a user changes their password:

1. The current password is verified using `supabase.auth.signInWithPassword`
2. If verification is successful, the new password is set using `supabase.auth.updateUser`
3. The `password_updated_at` timestamp in the `public.users` table is updated
4. The user is notified of the successful password change

### Login Process

When a user logs in:

1. The application checks if the email exists in the `public.users` table
2. If the email exists, the application attempts to sign in using `supabase.auth.signInWithPassword`
3. If the password is correct, the user is logged in and redirected to the Home screen
4. If the password is incorrect, an error message is displayed

## Database Migration

To apply the database changes for password tracking:

1. Run the migration file `supabase/migrations/20230101000000_add_password_tracking.sql`
2. This adds a `password_updated_at` column to the `public.users` table
3. It also updates the `handle_new_user` function to include the `password_updated_at` field

## Security Considerations

- Passwords are never stored in plain text
- Password verification is done server-side by Supabase
- The application uses secure password requirements (minimum length, complexity)
- Password changes require verification of the current password
- The application tracks when passwords are changed for security auditing 