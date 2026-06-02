# Supabase Setup

## Running migrations

1. Go to Supabase Dashboard → SQL Editor
2. Paste the contents of `migrations/001_initial_schema.sql`
3. Click Run

## First admin user

After running the migration, create your first user in Supabase Dashboard → Authentication → Add User.
Then run this SQL to make them admin:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
```
