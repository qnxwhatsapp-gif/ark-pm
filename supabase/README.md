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

## Deploying Edge Functions

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Deploy create-user function:
   ```bash
   supabase functions deploy create-user --project-ref YOUR_PROJECT_REF
   ```
   Find your project ref at: Supabase Dashboard → Settings → General → Reference ID

The `create-user` function requires the `SUPABASE_SERVICE_ROLE_KEY` environment variable. This is automatically available in deployed Edge Functions via Supabase's built-in secrets.

## notify-task-assigned Edge Function

Creates an in-app notification when a task is assigned to a user.

Deploy:
```bash
supabase functions deploy notify-task-assigned --project-ref YOUR_PROJECT_REF
```

Call from the frontend after assigning a task:
```js
await supabase.functions.invoke('notify-task-assigned', {
  body: { task_id, assigned_to, task_title, project_name }
})
```
