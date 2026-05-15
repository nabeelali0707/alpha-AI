"use client";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // In dev, let callers handle missing config more gracefully
  console.warn("Supabase client missing environment variables");
}

export const supabase = createClient(url || "", anonKey || "");
