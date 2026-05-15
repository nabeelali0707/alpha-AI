Frontend Supabase Setup

1. Install client dependency:
   - `npm install @supabase/supabase-js`

2. Set environment variables (see .env.example):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

3. The app now includes a simple `AuthProvider` and `supabaseClient` wrapper.
   Wraps are located at `src/context/AuthProvider.tsx` and `lib/supabaseClient.ts`.
