# Supabase Setup Guide

This guide will help you connect the registration form to your Supabase database.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 2: Create Environment Variables

1. Create a `.env` file in the root of your project (same directory as `package.json`)
2. Add the following variables:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example
```

⚠️ **Important:** Never commit your `.env` file to version control. Make sure `.env` is in your `.gitignore` file.

## Step 3: Create the Database Table

In your Supabase project, go to **Table Editor** and create a new table called `registrations` with the following columns:

| Column Name | Type | Default Value | Nullable | Unique |
|------------|------|---------------|----------|--------|
| `id` | `uuid` | `gen_random_uuid()` | No | Yes (Primary Key) |
| `name` | `text` | - | No | No |
| `email` | `text` | - | No | Yes |
| `phone` | `text` | - | No | No |
| `college` | `text` | - | No | No |
| `ticket_type` | `text` | - | Yes | No |
| `price` | `text` | - | Yes | No |
| `is_rit_student` | `boolean` | `false` | Yes | No |
| `created_at` | `timestamptz` | `now()` | No | No |

### SQL to Create the Table

You can also run this SQL in the Supabase SQL Editor:

```sql
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  college TEXT NOT NULL,
  ticket_type TEXT,
  price TEXT,
  is_rit_student BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create an index on email for faster lookups
CREATE INDEX idx_registrations_email ON registrations(email);

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert (for registration)
CREATE POLICY "Allow public insert" ON registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create a policy that allows authenticated users to read (optional)
CREATE POLICY "Allow authenticated read" ON registrations
  FOR SELECT
  TO authenticated
  USING (true);
```

## Step 4: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the registration form in your app
3. Fill out the form and submit
4. Check your Supabase table to verify the data was inserted

## Troubleshooting

### Error: "Supabase URL and/or Anon Key are missing"
- Make sure your `.env` file exists in the project root
- Verify the variable names are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your development server after creating/modifying `.env`

### Error: "relation 'registrations' does not exist"
- The table hasn't been created yet. Follow Step 3 to create it.

### Error: "duplicate key value violates unique constraint"
- The email address is already registered. This is expected behavior - the form will show an error message.

### Error: "new row violates row-level security policy"
- Check your RLS policies. Make sure you've created the insert policy as shown in Step 3.

## Additional Notes

- The registration form automatically:
  - Normalizes email addresses (lowercase, trimmed)
  - Stores phone numbers as digits only
  - Detects RIT students based on email domain and college name
  - Shows appropriate pricing based on student status
  - Prevents duplicate registrations (email must be unique)

- For production, consider:
  - Adding email verification
  - Setting up proper RLS policies
  - Adding rate limiting
  - Setting up database backups
