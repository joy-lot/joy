# 향기요정 - 학생용 향 추천 챗봇

초등학생~고등학생을 대상으로, Gemini 무료 API를 이용해 대화를 통해 어울리는 향을 추천받고
안전한 DIY 향수 만들기 방법을 배울 수 있는 챗봇 웹앱입니다.

## 시작하기

1. 의존성 설치

```bash
npm install
```

2. Gemini API 키 발급

- https://aistudio.google.com/apikey 에서 무료 API 키를 발급받습니다 (Google 계정 필요).

3. 환경변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 발급받은 키를 입력합니다.

```bash
cp .env.example .env.local
```

```
GEMINI_API_KEY=발급받은-키
GEMINI_MODEL=gemini-2.5-flash
```

4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 구조

- `src/app/page.tsx` — 채팅 UI (학년 선택 → 대화)
- `src/app/api/chat/route.ts` — Gemini API를 호출하는 서버 라우트 (API 키는 서버에서만 사용, 브라우저에 노출되지 않음)
- `src/lib/systemPrompt.ts` — 학년별 말투와 향 추천/향수 안전 제작 가이드를 담은 시스템 프롬프트
- `src/lib/gemini.ts` — `@google/genai` SDK 래퍼

## 안전 관련 참고

향수 만들기 안내는 에센셜 오일 원액 사용 금지, 패치 테스트, 음용/알코올 레시피 금지 등
미성년자 기준 안전 수칙을 시스템 프롬프트에 포함하고 있습니다. 실제 배포 전에는
학교/보호자 검수를 한 번 더 받는 것을 권장합니다.
