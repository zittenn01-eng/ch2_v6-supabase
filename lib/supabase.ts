import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가 설정되지 않았습니다.");
    _client = createClient(url, key);
  }
  return _client;
}

export interface StudentSubmission {
  id?: string;
  school: string;
  department: string;
  student_id: string;
  name: string;
  code: string;
  vercel_url?: string;
  submitted_at?: string;
  updated_at?: string;
}
