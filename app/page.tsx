"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ──────────────────────────────────────────────
// 기본 코드
// ──────────────────────────────────────────────
const DEFAULT_CODE = `#[2장]
#피자메뉴
pizza1 = "페퍼로니 피자"
pizza2 = "치즈 피자"
pizza3 = "콤비네이션 피자"
pizza4 = "불고기 피자"
pizza5 = "해산물 피자"
price1 = 3500

# 피자 선택
print("피자를 선택해주세요/한 종류의 피자만 선택가능합니다.")
print(pizza1, "(",price1,"원)")
print(pizza2, "(",price1,"원)")
print(pizza3, "(",price1,"원)")
print(pizza4, "(",price1,"원)")
print(pizza5, "(",price1,"원)")

pizza = input("피자 이름을 입력하세요: ")
pizza_count = int(input("수량을 입력하세요:여러 조각을 선택가능합니다 "))
# 피자 총 주문 가격 계산
total_price = 0

print("===========================")
print("주문 내역:")
print("===========================")
print("피자:")

subtotal = price1 * pizza_count
total_price = total_price + subtotal

print("-",pizza,"(",price1,"원) x",pizza_count)
print("---------------------------")
print(" 피자 총 가격:", subtotal,"원")
`;

const LS_KEY = "pizza_editor_code";
const LS_STUDENT_KEY = "pizza_student_info";

// ──────────────────────────────────────────────
// 파싱 헬퍼
// ──────────────────────────────────────────────
function parsePizzaNames(code: string): string[] {
  const names: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const m = code.match(new RegExp(`pizza${i}\\s*=\\s*["']([^"']+)["']`));
    names.push(m ? m[1] : `피자${i}`);
  }
  return names;
}

function parsePrice(code: string): number {
  const m = code.match(/price1\s*=\s*(\d+)/);
  return m ? parseInt(m[1], 10) : 3500;
}

function parseDrinkNames(code: string): string[] {
  const names: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const m = code.match(new RegExp(`drink${i}\\s*=\\s*["']([^"']+)["']`));
    if (m) names.push(m[1]);
  }
  return names;
}

function parseDrinkPrice(code: string): number {
  const m =
    code.match(/drink_price\s*=\s*(\d+)/) ||
    code.match(/price2\s*=\s*(\d+)/);
  return m ? parseInt(m[1], 10) : 2000;
}

function hasDrink(code: string): boolean {
  return /drink1\s*=/.test(code);
}

// ──────────────────────────────────────────────
// 데이터 타입 유효성 검사
// ──────────────────────────────────────────────
interface ValidationError {
  varName: string;
  message: string;
}

function validateDrinkTypes(code: string): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const varName of ["drink1", "drink2"]) {
    const lineMatch = code.match(new RegExp(`^\\s*${varName}\\s*=\\s*(.+)$`, "m"));
    if (!lineMatch) continue;
    const rhs = lineMatch[1].trim();
    if (/^\d+(\.\d+)?$/.test(rhs)) {
      errors.push({ varName, message: `음료수 이름은 문자열 데이터예요. 따옴표(" 또는 ')로 감싸주세요. (예: ${varName} = "콜라")` });
      continue;
    }
    if (!/^["']/.test(rhs) && /[가-힣a-zA-Z]/.test(rhs)) {
      errors.push({ varName, message: `문자열 데이터는 따옴표가 필요해요. (예: ${varName} = "콜라")` });
    }
  }

  for (const varName of ["drink_price", "price2"]) {
    const lineMatch = code.match(new RegExp(`^\\s*${varName}\\s*=\\s*(.+)$`, "m"));
    if (!lineMatch) continue;
    const rhs = lineMatch[1].trim();
    if (/^["']/.test(rhs)) {
      errors.push({ varName, message: `가격은 정수(숫자) 데이터예요. 따옴표를 제거해주세요. (예: ${varName} = 2000)` });
      continue;
    }
    if (/[가-힣a-zA-Z]/.test(rhs) && !/^["']/.test(rhs)) {
      errors.push({ varName, message: `가격은 정수(숫자) 데이터예요. 숫자만 입력해주세요.` });
    }
  }

  return errors;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadPyodide: (config?: any) => Promise<any>;
  }
}

// ──────────────────────────────────────────────
// 학생 정보 타입
// ──────────────────────────────────────────────
interface StudentInfo {
  school: string;
  department: string;
  student_id: string;
  name: string;
}

// ──────────────────────────────────────────────
// 학생 정보 입력 모달
// ──────────────────────────────────────────────
function StudentModal({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: StudentInfo;
  onSave: (info: StudentInfo) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [info, setInfo] = useState<StudentInfo>(initial);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!info.name.trim()) { alert("이름을 입력해주세요."); return; }
    onSave(info);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-icon">💾</span>
          <h2 className="modal-title">코드 저장 — 학생 정보 입력</h2>
        </div>
        <p className="modal-desc">정보를 입력하면 DB에 코드가 저장됩니다.<br />다음에는 자동으로 불러올 수 있어요.</p>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">학교명</label>
            <input className="modal-input" name="school" value={info.school} onChange={handleChange} placeholder="예: 한국중학교" />
          </div>
          <div className="modal-field">
            <label className="modal-label">학과 / 학년반</label>
            <input className="modal-input" name="department" value={info.department} onChange={handleChange} placeholder="예: 2학년 3반" />
          </div>
          <div className="modal-field">
            <label className="modal-label">학번</label>
            <input className="modal-input" name="student_id" value={info.student_id} onChange={handleChange} placeholder="예: 2024030" />
          </div>
          <div className="modal-field">
            <label className="modal-label">이름 <span className="modal-required">*필수</span></label>
            <input className="modal-input" name="name" value={info.name} onChange={handleChange} placeholder="예: 홍길동" required />
          </div>
          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onCancel}>취소</button>
            <button type="submit" className="modal-btn-save" disabled={isSaving}>
              {isSaving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 메인 컴포넌트
// ──────────────────────────────────────────────
export default function PizzaPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [pyStatus, setPyStatus] = useState<"loading" | "ready" | "error">("loading");

  // 피자
  const [pizzaNames, setPizzaNames] = useState<string[]>([]);
  const [price, setPrice] = useState(3500);
  const [selectedPizza, setSelectedPizza] = useState("");
  const [pizzaCount, setPizzaCount] = useState(1);

  // 음료수
  const [drinkNames, setDrinkNames] = useState<string[]>([]);
  const [drinkPrice, setDrinkPrice] = useState(2000);
  const [selectedDrink, setSelectedDrink] = useState("");
  const [drinkCount, setDrinkCount] = useState(1);
  const [drinkExists, setDrinkExists] = useState(false);

  // 실행 상태
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 유효성 검사 오류
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // 모달
  const [showModal, setShowModal] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({ school: "", department: "", student_id: "", name: "" });

  // 저장 성공 토스트
  const [saveToast, setSaveToast] = useState<"" | "success" | "error">("");

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const errorBoxRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pyodideRef = useRef<any>(null);

  // ── 코드 파싱 → 상태 동기화
  useEffect(() => {
    const names = parsePizzaNames(code);
    const p = parsePrice(code);
    setPizzaNames(names);
    setPrice(p);
    setSelectedPizza((prev) => (names.includes(prev) ? prev : names[0]));

    const dNames = parseDrinkNames(code);
    const dPrice = parseDrinkPrice(code);
    const dExists = hasDrink(code);
    setDrinkNames(dNames);
    setDrinkPrice(dPrice);
    setDrinkExists(dExists);
    setSelectedDrink((prev) => (dNames.includes(prev) ? prev : dNames[0] ?? ""));

    setValidationErrors([]);
  }, [code]);

  // ── 초기 로드: localStorage 학생 정보 복원
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setCode(saved);

    const savedStudent = localStorage.getItem(LS_STUDENT_KEY);
    if (savedStudent) {
      try { setStudentInfo(JSON.parse(savedStudent)); } catch { /* ignore */ }
    }
  }, []);

  // ── Pyodide 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
    script.onload = async () => {
      try {
        const py = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/" });
        pyodideRef.current = py;
        setPyStatus("ready");
      } catch { setPyStatus("error"); }
    };
    script.onerror = () => setPyStatus("error");
    document.head.appendChild(script);
  }, []);

  // ── 줄번호
  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // ── 스크롤 동기화
  const handleEditorScroll = () => {
    if (editorRef.current && lineNumRef.current)
      lineNumRef.current.scrollTop = editorRef.current.scrollTop;
  };

  // ── Tab 키
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 4; });
    }
  };

  // ── 출력 스크롤
  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  // ── 오류 시 스크롤
  useEffect(() => {
    if (validationErrors.length > 0 && errorBoxRef.current) {
      errorBoxRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [validationErrors]);

  // ── DB 저장 실행
  const saveToSupabase = useCallback(async (info: StudentInfo) => {
    setIsSaving(true);
    localStorage.setItem(LS_KEY, code);
    localStorage.setItem(LS_STUDENT_KEY, JSON.stringify(info));

    try {
      const res = await fetch("/api/pizza-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...info,
          code,
          vercel_url: window.location.hostname,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaveToast("success");
      } else {
        setSaveToast("error");
      }
    } catch {
      setSaveToast("error");
    } finally {
      setIsSaving(false);
      setShowModal(false);
      setTimeout(() => setSaveToast(""), 3000);
    }
  }, [code]);

  // ── 내 코드 불러오기
  const loadMyCode = useCallback(async () => {
    if (!studentInfo.name.trim()) { alert("먼저 정보를 입력하여 저장한 후 불러올 수 있어요."); return; }
    try {
      const params = new URLSearchParams({
        school: studentInfo.school,
        student_id: studentInfo.student_id,
        name: studentInfo.name,
      });
      const res = await fetch(`/api/pizza-code?${params}`);
      const data = await res.json();
      if (data.code) {
        setCode(data.code);
        alert(`✅ 코드를 불러왔어요! (저장 시각: ${data.submitted_at ? new Date(data.submitted_at).toLocaleString("ko-KR") : "알 수 없음"})`);
      } else {
        alert("저장된 코드가 없어요. 먼저 저장을 해주세요.");
      }
    } catch {
      alert("불러오기 실패. 네트워크를 확인해주세요.");
    }
  }, [studentInfo]);

  // ── pizza.py 다운로드
  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pizza.py";
    a.click();
    URL.revokeObjectURL(url);
  }, [code]);

  // ── 코드 저장 버튼 클릭 → 모달 열기
  const handleSaveClick = useCallback(() => {
    const errors = validateDrinkTypes(code);
    if (errors.length > 0) { setValidationErrors(errors); return; }
    setValidationErrors([]);
    setShowModal(true);
  }, [code]);

  // ── 모달 저장 완료 → Pyodide 실행
  const handleModalSave = useCallback(async (info: StudentInfo) => {
    setStudentInfo(info);
    await saveToSupabase(info);
    // Pyodide 실행
    if (pyStatus !== "ready" || isRunning) return;
    setIsRunning(true);
    try {
      const py = pyodideRef.current;
      const inputs = [
        selectedPizza,
        String(pizzaCount),
        drinkExists ? selectedDrink : "",
        drinkExists ? String(drinkCount) : "0",
      ];
      let inputIdx = 0;
      py.globals.set("__input_override__", (_prompt: string) => {
        const val = inputs[inputIdx] ?? "";
        inputIdx++;
        return val;
      });
      const wrappedCode = `
import sys
import io

_stdout = io.StringIO()
sys.stdout = _stdout

def input(prompt=""):
    return __input_override__(prompt)

${code}

sys.stdout = sys.__stdout__
__captured__ = _stdout.getvalue()
`;
      await py.runPythonAsync(wrappedCode);
      const captured: string = py.globals.get("__captured__");
      setOutput(captured);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setOutput(`❌ 파이썬 오류:\n${msg}`);
    } finally {
      setIsRunning(false);
    }
  }, [pyStatus, isRunning, code, selectedPizza, pizzaCount, drinkExists, selectedDrink, drinkCount, saveToSupabase]);

  // ── 소계 계산
  const pizzaSubtotal = price * pizzaCount;
  const drinkSubtotal = drinkExists ? drinkPrice * drinkCount : 0;
  const grandTotal = pizzaSubtotal + drinkSubtotal;

  // ──────────────────────────────────────────────
  // JSX
  // ──────────────────────────────────────────────
  return (
    <div className="pizza-root">
      {/* 모달 */}
      {showModal && (
        <StudentModal
          initial={studentInfo}
          onSave={handleModalSave}
          onCancel={() => setShowModal(false)}
          isSaving={isSaving}
        />
      )}

      {/* 저장 토스트 */}
      {saveToast && (
        <div className={`save-toast save-toast--${saveToast}`}>
          {saveToast === "success" ? "✅ DB에 저장 완료!" : "❌ 저장 실패. 다시 시도해주세요."}
        </div>
      )}

      {/* ── 헤더 ── */}
      <header className="header">
        <div className="header-left">
          <span className="header-emoji">🍕</span>
          <div>
            <h1 className="header-title">파이썬 피자 주문 실습</h1>
            <p className="header-subtitle">변수 &amp; 표준 입출력 · 2장</p>
          </div>
        </div>
        <div className="header-right">
          {pyStatus === "ready" && <span className="badge badge-ready">🟢 Python 준비 완료</span>}
          {pyStatus === "loading" && <span className="badge badge-loading"><span className="spin">⏳</span> Pyodide 로딩 중...</span>}
          {pyStatus === "error" && <span className="badge badge-error">🔴 Python 로드 실패</span>}
          <a href="/admin" className="admin-link" target="_blank">📊 선생님 대시보드</a>
        </div>
      </header>

      {/* ── 본문 2분할 ── */}
      <main className="main-grid">

        {/* ══════════════ 왼쪽 패널 ══════════════ */}
        <section className="left-panel">
          <div className="panel-label">🛒 주문 창</div>

          {/* 🍕 피자 섹션 */}
          <div className="section-title">🍕 피자</div>

          <div className="card">
            <label className="field-label">피자 선택</label>
            <div className="select-wrapper">
              <select id="pizza-select" className="select" value={selectedPizza}
                onChange={(e) => setSelectedPizza(e.target.value)}>
                {pizzaNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <span className="select-arrow">▾</span>
            </div>
          </div>

          <div className="card">
            <label className="field-label">수량</label>
            <div className="qty-row">
              <button id="pizza-qty-minus" className="qty-btn" onClick={() => setPizzaCount((c) => Math.max(1, c - 1))}>−</button>
              <input id="pizza-qty-input" type="number" className="qty-input" min={1} value={pizzaCount}
                onChange={(e) => setPizzaCount(Math.max(1, parseInt(e.target.value) || 1))} />
              <button id="pizza-qty-plus" className="qty-btn" onClick={() => setPizzaCount((c) => c + 1)}>+</button>
            </div>
          </div>

          {/* 피자 소계 요약 */}
          <div className="summary-card">
            <div className="summary-row"><span className="summary-label">단가</span><span className="summary-value">{price.toLocaleString()}원</span></div>
            <div className="summary-row"><span className="summary-label">수량</span><span className="summary-value">{pizzaCount}개</span></div>
            <div className="summary-divider" />
            <div className="summary-row">
              <span className="summary-label">피자 소계</span>
              <span className="summary-subtotal">{pizzaSubtotal.toLocaleString()}원</span>
            </div>
          </div>

          {/* 🥤 음료수 섹션 */}
          {drinkExists ? (
            <>
              <div className="section-title section-title--drink">🥤 음료수</div>
              <div className="card card--drink">
                <label className="field-label">음료수 선택</label>
                <div className="select-wrapper">
                  <select id="drink-select" className="select" value={selectedDrink}
                    onChange={(e) => setSelectedDrink(e.target.value)}>
                    {drinkNames.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <span className="select-arrow">▾</span>
                </div>
              </div>
              <div className="card card--drink">
                <label className="field-label">수량</label>
                <div className="qty-row">
                  <button id="drink-qty-minus" className="qty-btn qty-btn--drink" onClick={() => setDrinkCount((c) => Math.max(1, c - 1))}>−</button>
                  <input id="drink-qty-input" type="number" className="qty-input" min={1} value={drinkCount}
                    onChange={(e) => setDrinkCount(Math.max(1, parseInt(e.target.value) || 1))} />
                  <button id="drink-qty-plus" className="qty-btn qty-btn--drink" onClick={() => setDrinkCount((c) => c + 1)}>+</button>
                </div>
              </div>
              <div className="summary-card summary-card--drink">
                <div className="summary-row"><span className="summary-label">단가</span><span className="summary-value">{drinkPrice.toLocaleString()}원</span></div>
                <div className="summary-row"><span className="summary-label">수량</span><span className="summary-value">{drinkCount}개</span></div>
                <div className="summary-divider" />
                <div className="summary-row">
                  <span className="summary-label">음료수 소계</span>
                  <span className="summary-subtotal summary-subtotal--drink">{drinkSubtotal.toLocaleString()}원</span>
                </div>
              </div>
            </>
          ) : (
            <div ref={errorBoxRef}>
              {validationErrors.length > 0 ? (
                <div className="error-box">
                  <div className="error-box__title">⚠️ 데이터 타입 오류</div>
                  {validationErrors.map((err, i) => (
                    <div key={i} className="error-box__item">
                      <span className="error-box__var">{err.varName}</span>
                      <span className="error-box__msg">{err.message}</span>
                    </div>
                  ))}
                  <p className="error-box__hint">코드를 수정하면 이 메시지가 사라집니다.</p>
                </div>
              ) : (
                <div className="assignment-box">
                  <div className="assignment-box__header">
                    <span className="assignment-box__icon">📝</span>
                    <span className="assignment-box__title">음료수 메뉴 추가 과제</span>
                  </div>
                  <p className="assignment-box__desc">
                    오른쪽 코드 수정창에서 아래 정보를 참고하여<br />
                    직접 변수를 선언하는 코드를 작성해보세요!
                  </p>
                  <table className="assignment-table">
                    <thead>
                      <tr><th>변수명</th><th>값</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><code>drink1</code></td><td>콜라</td></tr>
                      <tr><td><code>drink2</code></td><td>사이다</td></tr>
                      <tr><td><code>drink_price</code></td><td>2000</td></tr>
                    </tbody>
                  </table>
                  <div className="assignment-box__notes">
                    <p>⚠️ <strong>주의:</strong> 값의 데이터 타입(문자열/숫자)을 스스로 판단하여 따옴표 여부를 결정하세요!</p>
                    <p>💡 변수를 추가하는 순간 이 자리에 음료수 주문창이 자동으로 나타납니다!</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {drinkExists && validationErrors.length > 0 && (
            <div ref={errorBoxRef} className="error-box">
              <div className="error-box__title">⚠️ 데이터 타입 오류</div>
              {validationErrors.map((err, i) => (
                <div key={i} className="error-box__item">
                  <span className="error-box__var">{err.varName}</span>
                  <span className="error-box__msg">{err.message}</span>
                </div>
              ))}
              <p className="error-box__hint">코드를 수정하면 이 메시지가 사라집니다.</p>
            </div>
          )}

          {/* 총 합계 카드 */}
          <div className="total-card">
            <div className="total-card__row">
              <span className="total-card__label">피자 소계</span>
              <span className="total-card__value">{pizzaSubtotal.toLocaleString()}원</span>
            </div>
            {drinkExists && (
              <div className="total-card__row">
                <span className="total-card__label">음료수 소계</span>
                <span className="total-card__value">{drinkSubtotal.toLocaleString()}원</span>
              </div>
            )}
            <div className="total-card__divider" />
            <div className="total-card__row total-card__row--grand">
              <span className="total-card__grand-label">총 합계</span>
              <span className="total-card__grand-value">{grandTotal.toLocaleString()}원</span>
            </div>
          </div>

          {/* 터미널 영수증 */}
          <div className="terminal-label">
            <span className="terminal-dot" />
            <span className="terminal-dot" style={{ background: "#f1c40f" }} />
            <span className="terminal-dot" style={{ background: "#2ecc71" }} />
            <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "#888" }}>python output</span>
          </div>
          <div className="terminal" ref={outputRef}>
            {output ? (
              <pre className="terminal-text">{output}</pre>
            ) : (
              <span className="terminal-placeholder">
                {pyStatus === "loading"
                  ? "⏳ Pyodide 로딩 중..."
                  : "아래 \"코드 저장 및 주문하기\" 버튼을 누르면\n파이썬 print() 출력이 여기 표시됩니다."}
              </span>
            )}
          </div>

          {/* 버튼 그룹 */}
          <div className="btn-group">
            <button id="run-btn" className="run-btn"
              disabled={pyStatus !== "ready" || isRunning}
              onClick={handleSaveClick}>
              {isRunning ? <><span className="spin">⚙️</span> 파이썬 실행 중...</>
                : isSaving ? "💾 DB 저장 중..."
                : "▶ 코드 저장 및 주문하기 (파이썬 실행)"}
            </button>
            <div className="btn-row">
              <button id="load-btn" className="load-btn" onClick={loadMyCode}>
                ☁️ 내 코드 불러오기
              </button>
              <button id="download-btn" className="download-btn" onClick={handleDownload} title="현재 코드를 pizza.py로 내 컴퓨터에 저장합니다">
                📥 pizza.py 저장
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════ 오른쪽 패널 (에디터) ══════════════ */}
        <section className="right-panel">
          <div className="panel-label">
            📝 파이썬 코드 에디터 <span className="panel-label-sub">— pizza.py</span>
          </div>
          <div className="editor-wrapper">
            <div className="line-numbers" ref={lineNumRef}>
              {lineNumbers.map((n) => <div key={n} className="line-num">{n}</div>)}
            </div>
            <textarea
              id="code-editor"
              ref={editorRef}
              className="code-editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleEditorScroll}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
          <div className="editor-hint">
            💡 <strong>pizza1~pizza5</strong> 이름이나 <strong>price1</strong> 값을 바꾸면 왼쪽 메뉴가 실시간 반영됩니다.
            &nbsp;|&nbsp; <strong>drink1~drink10</strong> 및 <strong>drink_price</strong> 변수를 추가하면 음료수 섹션이 자동으로 나타납니다. Tab 키로 들여쓰기 가능.
          </div>
        </section>
      </main>
    </div>
  );
}
