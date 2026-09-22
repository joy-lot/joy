# 질문 있는 유전 노트 — AI 대화형 + 교사 대시보드

중학교 과학 "유전과 진화" 탐구 활동(핵형 분석 / 가계도 분석 / 동전 던지기) 웹앱입니다.
학생이 활동 후 남긴 탐구 질문을 Gemini와의 대화로 이어갈 수 있고, 모든 질문·대화는
선생님만 볼 수 있는 대시보드(`/dashboard.html`)에 모입니다.

Gemini API 키는 오직 서버(Vercel 서버리스 함수) 안에서만 사용되며, 학생 화면에는 절대
전달되지 않습니다.

## 준비물 (모두 무료)

1. **Google AI Studio** 계정 — Gemini API 키 (이미 발급받으셨다면 그대로 사용)
2. **Supabase** 계정 — 질문·대화 저장용 데이터베이스
3. **Vercel** 계정 — 웹사이트 + 서버 배포
4. **GitHub** 계정 — 이 프로젝트 코드를 올려서 Vercel과 연결 (권장 방법)

## 1단계 · Supabase 데이터베이스 만들기

1. https://supabase.com 에서 새 프로젝트를 만듭니다.
2. 왼쪽 메뉴 **SQL Editor** → New query 에서 이 저장소의 [`sql/schema.sql`](sql/schema.sql) 내용을
   그대로 붙여넣고 실행(Run)합니다. `questions`, `messages` 두 테이블이 생성됩니다.
3. 왼쪽 메뉴 **Project Settings → API** 로 이동해 아래 두 값을 복사해 둡니다.
   - `Project URL` → `SUPABASE_URL`
   - `service_role` 비밀 키(secret) → `SUPABASE_SERVICE_ROLE_KEY` (절대 외부에 공유하지 마세요)

## 2단계 · Gemini API 키 확인

https://aistudio.google.com/apikey 에서 발급받은 키를 준비합니다 → `GEMINI_API_KEY`

## 3단계 · GitHub에 올리고 Vercel과 연결

1. 이 `genetics-lab-app` 폴더 전체를 새 GitHub 저장소로 올립니다(비공개 저장소 추천).
2. https://vercel.com → **Add New → Project** → 방금 만든 저장소를 선택 → Import.
3. Framework Preset은 **Other**로 두고(자동 감지됨), 그대로 **Deploy**를 누릅니다.
   (처음 배포는 환경 변수가 없어 AI 대화·대시보드가 아직 동작하지 않아도 정상입니다.)

## 4단계 · 환경 변수 설정

Vercel 프로젝트 → **Settings → Environment Variables** 에서 아래 값을 각각 추가합니다.

| 이름 | 값 |
|---|---|
| `GEMINI_API_KEY` | 2단계에서 준비한 키 |
| `GEMINI_MODEL` | (선택) 비워두면 `gemini-2.5-flash` 사용 |
| `SUPABASE_URL` | 1단계에서 복사한 Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 1단계에서 복사한 service_role 키 |
| `TEACHER_PASSCODE` | 대시보드 접속용 암호 (직접 정하기, 예: 학교명+숫자) |

저장 후 **Deployments** 탭에서 최신 배포를 **Redeploy** 합니다(환경 변수는 재배포해야 적용됩니다).

## 5단계 · 사용하기

- 학생용 링크: `https://<프로젝트이름>.vercel.app/` — 이 링크를 학생들에게 공유하세요.
  처음 접속하면 학교·학년·반·번호·이름을 입력하는 화면이 뜨고, 한 번 입력하면 그 기기(브라우저)에
  저장되어 다음에 다시 열어도 입력할 필요가 없습니다. (다른 기기에서 접속하면 다시 입력해야 합니다.)
- 교사 대시보드: `https://<프로젝트이름>.vercel.app/dashboard.html` — 4단계에서 정한 암호로 입장하면
  학교 → 학년 → 반 순서로 좁혀 가며 필터링해서 볼 수 있습니다.

## 참고

- 한 학생의 질문당 대화가 12개 메시지를 넘으면 자동으로 대화가 종료됩니다
  (`api/chat.js`의 `MAX_MESSAGES_PER_QUESTION`) — Gemini API 사용량(비용) 폭주를 막기 위한
  안전장치이며, 숫자는 필요에 따라 바꿔도 됩니다.
- 학교·학년·반·번호·이름은 필수 입력이며, 서버에도 다시 한번 검증됩니다(빈 값이면 저장되지 않음).
  실명이 부담스럽다면 이름 칸에 별명을 쓰도록 안내해도 됩니다 — 학년·반·번호로 이미 구분이 되므로
  기록 관리에는 문제없습니다.
- 기존에 이미 `sql/schema.sql`을 한 번 실행해서 `questions` 테이블을 만들어 두셨다면, 학교·학년·반·번호
  컬럼이 없으므로 schema.sql 안의 주석 처리된 `alter table` 4줄을 Supabase SQL Editor에서 추가로
  실행해 주세요.
- 링크만으로 배포 없이 바로 써 볼 수 있는 로컬스토리지 전용 버전(AI 대화 없음)은 기존에
  전달해 드린 Claude Artifact 링크를 계속 사용하시면 됩니다.
