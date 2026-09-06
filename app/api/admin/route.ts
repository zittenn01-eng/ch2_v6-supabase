import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET: 모든 학생 제출 목록 조회 (?school=&department=)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const school = searchParams.get("school") || "";
  const department = searchParams.get("department") || "";

  const supabase = getSupabase();
  let query = supabase
    .from("student_submissions")
    .select("id, school, department, student_id, name, code, vercel_url, submitted_at, updated_at")
    .order("updated_at", { ascending: false });

  if (school) query = query.eq("school", school);
  if (department) query = query.eq("department", department);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, submissions: data ?? [] });
}
