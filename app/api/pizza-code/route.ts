import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET: 특정 학생의 코드 조회 (?school=&student_id=&name=)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const school = searchParams.get("school") || "";
  const student_id = searchParams.get("student_id") || "";
  const name = searchParams.get("name") || "";

  if (!student_id || !name) {
    return NextResponse.json({ code: null, error: "student_id and name required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("student_submissions")
    .select("code, submitted_at")
    .eq("school", school)
    .eq("student_id", student_id)
    .eq("name", name)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ code: null });
  }
  return NextResponse.json({ code: data.code, submitted_at: data.submitted_at });
}

// POST: 학생 코드 저장 (upsert)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { school, department, student_id, name, code, vercel_url } = body;

    if (!name || !code) {
      return NextResponse.json({ ok: false, error: "name and code required" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("student_submissions")
      .upsert(
        {
          school: school || "",
          department: department || "",
          student_id: student_id || "",
          name,
          code,
          vercel_url: vercel_url || "",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "school,student_id,name",
        }
      );

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
