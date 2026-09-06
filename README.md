# 파이썬 피자 주문 실습 — Supabase DB 연동 버전 (ch2-v6-supabase)

> **2장 변수 & 표준 입출력** 실습 웹앱  
> 학생이 코드를 수정하면 Supabase DB에 저장되고, 선생님은 대시보드에서 전체 제출 현황을 볼 수 있습니다.

---

## ✅ 완료된 작업 (2026-09-06)

| 항목 | 상태 |
|------|------|
| 기존 프로젝트(`2.variable4`) 복사 → `ch2-v6-supabase` | ✅ |
| `@supabase/supabase-js` 패키지 설치 | ✅ |
| `lib/supabase.ts` — Supabase 클라이언트 (Lazy Init) | ✅ |
| `app/api/pizza-code/route.ts` — 학생 코드 저장/불러오기 API | ✅ |
| `app/api/admin/route.ts` — 전체 제출 목록 조회 API | ✅ |
| `app/page.tsx` — 학생 정보 입력 모달 + DB 저장 기능 | ✅ |
| `app/admin/page.tsx` — 선생님 대시보드 | ✅ |
| `app/globals.css` — 모달/토스트/대시보드 스타일 | ✅ |
| `npm run build` 성공 확인 | ✅ |
| GitHub 저장소 생성 (`zittenn01-eng/ch2_v6-supabase`) | ✅ |
| `git push origin main` 완료 | ✅ |

---

## ⏳ 아직 완료 안 된 작업 — 다음에 이어서 하기

아래 3단계를 순서대로 진행하면 배포가 완료됩니다.

---

## 🔧 STEP 1: Supabase 테이블 생성

### 1-1. Supabase 대시보드 접속
👉 https://supabase.com/dashboard 로그인

### 1-2. 프로젝트 선택
- 기존에 만들어둔 프로젝트 클릭

### 1-3. SQL Editor에서 테이블 생성
왼쪽 사이드바 → **SQL Editor** → **New query** → 아래 SQL 전체 복사·붙여넣기 → **Run (Ctrl+Enter)**

```sql
-- 학생 코드 제출 테이블 생성
CREATE TABLE student_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  student_id text NOT NULL DEFAULT '',
  name text NOT NULL,
  code text NOT NULL,
  vercel_url text DEFAULT '',
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 같은 학교+학번+이름이면 덮어쓰기(upsert)를 위한 unique 인덱스
CREATE UNIQUE INDEX student_submissions_unique
  ON student_submissions (school, student_id, name);

-- Row Level Security 활성화
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;

-- anon key로 읽기/쓰기 허용 (학생 앱에서 사용)
CREATE POLICY "allow_all" ON student_submissions
  FOR ALL USING (true) WITH CHECK (true);
```

> ✅ "Success. No rows returned." 메시지가 나오면 성공

---

## 🔑 STEP 2: Supabase API 키 확인

### 2-1. Settings → API 접속
왼쪽 사이드바 → **Settings** → **API**

### 2-2. 두 가지 값 복사해두기

| 이름 | 위치 | 예시 |
|------|------|------|
| **Project URL** | "Project URL" 항목 | `https://abcdefgh.supabase.co` |
| **anon public 키** | "Project API keys" → anon public | `eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...` |

> ⚠️ `service_role` 키는 절대 앱에 넣지 마세요. `anon` 키만 사용합니다.

---

## 🚀 STEP 3: Vercel 배포

### 3-1. Vercel에서 저장소 Import
👉 https://vercel.com/new 접속

1. **"Import Git Repository"** 에서 `zittenn01-eng/ch2_v6-supabase` 선택
2. **Import** 클릭

### 3-2. 환경변수 설정 (필수!)
**"Environment Variables"** 섹션에서 아래 두 개 추가:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | STEP 2에서 복사한 Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | STEP 2에서 복사한 anon public 키 |

### 3-3. Deploy 클릭
- 1~2분 후 배포 완료
- 배포된 URL 예시: `https://ch2-v6-supabase.vercel.app`

---

## 📁 프로젝트 파일 구조

```
ch2-v6-supabase/
├── app/
│   ├── page.tsx              # 학생 화면 (코드 에디터 + 주문창 + 저장/불러오기)
│   ├── globals.css           # 전체 스타일
│   ├── layout.tsx
│   ├── admin/
│   │   └── page.tsx          # 선생님 대시보드 (/admin)
│   └── api/
│       ├── pizza-code/
│       │   └── route.ts      # GET: 내 코드 불러오기 / POST: 코드 저장
│       └── admin/
│           └── route.ts      # GET: 전체 학생 제출 목록
├── lib/
│   └── supabase.ts           # Supabase 클라이언트 (Lazy Initialization)
├── pizza.py                  # 기본 파이썬 코드 (참고용)
├── .env.local.example        # 환경변수 예시 파일
├── .env.local                # ← 실제 키 입력 (git에 올라가지 않음!)
└── .gitignore
```

---

## 💻 로컬에서 실행하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 파일 생성
copy .env.local.example .env.local
# .env.local 파일을 열어 실제 Supabase URL과 키 입력

# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000 에서 학생 화면
# → http://localhost:3000/admin 에서 선생님 대시보드
```

---

## 🎯 주요 기능

### 학생 화면 (`/`)
- 파이썬 코드 에디터 (줄번호, Tab 들여쓰기)
- 코드 수정 시 좌측 피자/음료수 메뉴 실시간 반영
- **▶ 코드 저장 및 주문하기** 클릭 → 학생 정보 입력 모달 → Supabase DB 저장 + 파이썬 실행
- **☁️ 내 코드 불러오기** — 이전에 저장한 코드 DB에서 불러오기
- **📥 pizza.py 저장** — 현재 코드를 .py 파일로 다운로드
- 브라우저 localStorage에도 자동 저장 (재접속 시 복원)

### 선생님 대시보드 (`/admin`)
- 모든 학생 제출 코드 목록 조회
- 학교 / 학과별 필터
- 이름·학번 검색
- 각 학생 코드 클릭해서 내용 보기
- 학생별 코드 다운로드 (`.py` 파일)

---

## 🗂️ Supabase 테이블 구조

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | 자동 생성 PK |
| `school` | text | 학교명 |
| `department` | text | 학과/학년반 |
| `student_id` | text | 학번 |
| `name` | text | 이름 (필수) |
| `code` | text | 파이썬 코드 |
| `vercel_url` | text | 접속한 앱 주소 (자동) |
| `submitted_at` | timestamptz | 최초 제출 시각 |
| `updated_at` | timestamptz | 최종 수정 시각 |

> **같은 학교 + 학번 + 이름**이면 항상 덮어쓰기(upsert)됩니다.

---

## ❓ Q&A

**Q: AI 토큰이나 크레딧이 필요한가요?**  
A: 아닙니다. Supabase는 AI가 아닌 일반 데이터베이스입니다. 학생 30명이 하루 종일 사용해도 무료 한도의 1%도 사용하지 않습니다.

**Q: 학생 컴퓨터에 파이썬을 설치해야 하나요?**  
A: 아닙니다. 파이썬 실행은 브라우저 안의 Pyodide(WebAssembly)가 담당합니다. 최신 브라우저와 인터넷 연결만 있으면 됩니다.

**Q: 처음 접속 시 로딩이 오래 걸려요.**  
A: Pyodide 다운로드(약 10~30초)가 필요합니다. 헤더에 "🟢 Python 준비 완료"가 뜨면 사용 가능합니다.

---

## 🔗 관련 링크

- GitHub: https://github.com/zittenn01-eng/ch2_v6-supabase
- 기존 버전 (파일저장): https://2variable4.vercel.app
- Supabase 대시보드: https://supabase.com/dashboard
- Vercel 대시보드: https://vercel.com/dashboard
