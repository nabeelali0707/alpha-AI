Supabase Auth Integration

1. Set environment variables (see .env.example):
   - SUPABASE_URL
   - SUPABASE_ANON_KEY (optional for client)
   - SUPABASE_SERVICE_ROLE (recommended for server-side verification)

2. Endpoints added:
   - GET /api/v1/auth/me -> returns Supabase user object for the bearer token
   - GET /api/v1/auth/protected-test -> simple protected endpoint

3. How it works:
   - The backend calls Supabase `/auth/v1/user` with the provided bearer token
     and the `apikey` header set to the configured service key / anon key.

4. Notes:
   - For production, prefer verifying JWTs with Supabase JWKs or using
     the service role key only on trusted server environments.
   - Protect the service role key; do not expose it to the browser.
