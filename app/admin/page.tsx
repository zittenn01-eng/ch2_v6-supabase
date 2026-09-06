"use client";

import { useEffect, useState, useCallback } from "react";

interface Submission {
  id: string;
  school: string;
  department: string;
  student_id: string;
  name: string;
  code: string;
  vercel_url: string;
  submitted_at: string;
  updated_at: string;
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSchool, setFilterSchool] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [searchName, setSearchName] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterSchool) params.set("school", filterSchool);
    if (filterDept) params.set("department", filterDept);
    try {
      const res = await fetch(`/api/admin?${params}`);
      const data = await res.json();
      if (data.ok) setSubmissions(data.submissions);
    } catch {
      alert("데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }, [filterSchool, filterDept]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 고유 학교/학과 목록
  const schools = [...new Set(submissions.map((s) => s.school).filter(Boolean))];
  const departments = [...new Set(submissions.map((s) => s.department).filter(Boolean))];

  const filtered = submissions.filter((s) =>
    searchName ? s.name.includes(searchName) || s.student_id.includes(searchName) : true
  );

  const formatDate = (iso: string) =>
    iso ? new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";

  return (
    <div className="admin-root">
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-icon">📊</span>
          <div>
            <h1 className="admin-title">선생님 대시보드</h1>
            <p className="admin-subtitle">학생 코드 제출 현황</p>
          </div>
        </div>
        <a href="/" className="admin-back-btn">← 학생 화면으로</a>
      </header>

      <div className="admin-body">
        {/* 필터 바 */}
        <div className="admin-filters">
          <select className="admin-select" value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)}>
            <option value="">전체 학교</option>
            {schools.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="admin-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option value="">전체 학과/반</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input
            className="admin-search"
            placeholder="이름 또는 학번 검색..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button className="admin-refresh-btn" onClick={fetchData}>🔄 새로고침</button>
          <span className="admin-count">총 {filtered.length}명</span>
        </div>

        <div className="admin-content">
          {/* 목록 */}
          <div className="admin-list">
            {loading ? (
              <div className="admin-loading">⏳ 불러오는 중...</div>
            ) : filtered.length === 0 ? (
              <div className="admin-empty">제출된 코드가 없습니다.</div>
            ) : (
              filtered.map((s) => (
                <div
                  key={s.id}
                  className={`admin-card${selected?.id === s.id ? " admin-card--selected" : ""}`}
                  onClick={() => setSelected(s)}
                >
                  <div className="admin-card-top">
                    <span className="admin-card-name">{s.name}</span>
                    <span className="admin-card-id">{s.student_id || "학번 없음"}</span>
                  </div>
                  <div className="admin-card-mid">
                    {s.school && <span className="admin-tag">{s.school}</span>}
                    {s.department && <span className="admin-tag admin-tag--dept">{s.department}</span>}
                  </div>
                  <div className="admin-card-time">🕐 {formatDate(s.updated_at)}</div>
                </div>
              ))
            )}
          </div>

          {/* 코드 뷰어 */}
          <div className="admin-viewer">
            {selected ? (
              <>
                <div className="admin-viewer-header">
                  <div>
                    <span className="admin-viewer-name">{selected.name}</span>
                    <span className="admin-viewer-meta">
                      {[selected.school, selected.department, selected.student_id].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <div className="admin-viewer-time">최종 제출: {formatDate(selected.updated_at)}</div>
                </div>
                <pre className="admin-code">{selected.code}</pre>
                <button
                  className="admin-download-btn"
                  onClick={() => {
                    const blob = new Blob([selected.code], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `pizza_${selected.name}_${selected.student_id || "unknown"}.py`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  📥 이 학생 코드 다운로드
                </button>
              </>
            ) : (
              <div className="admin-viewer-empty">
                <span>👈</span>
                <p>왼쪽에서 학생을 선택하면<br />제출한 코드가 여기 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
