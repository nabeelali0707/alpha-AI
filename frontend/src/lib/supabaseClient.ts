// Backward compatibility shim — re-exports the browser Supabase client
export { supabase, createClient } from './supabase';
export type { Session, User } from '@supabase/supabase-js';
