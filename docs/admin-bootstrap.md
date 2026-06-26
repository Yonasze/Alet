# Admin Bootstrap

Use `/admin/bootstrap` once to create the first Supabase Auth admin user without email confirmation.

## Required Vercel environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALET_ADMIN_BOOTSTRAP_SECRET`

`SUPABASE_SERVICE_ROLE_KEY` must only be stored as a server-side environment variable. Never expose it in client-side code.

## Flow

1. Open `/admin/bootstrap` after deployment.
2. Enter the admin email and password you want to use.
3. Enter the private value from `ALET_ADMIN_BOOTSTRAP_SECRET`.
4. Submit the form.
5. The app calls Supabase Auth admin API with `email_confirm: true` and `app_metadata.role = admin`.
6. Sign in at `/admin/login` with that email and password.
7. Remove or rotate `ALET_ADMIN_BOOTSTRAP_SECRET` after the first admin is created.

## Important

This creates the Supabase Auth user only. For database-level RLS access, the admin still needs a matching row in `profiles` and membership rows in `user_projects` after the foundation migrations are applied.
