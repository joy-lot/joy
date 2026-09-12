# Stitch 프론트엔드 생성 프롬프트

이 문서는 Google Stitch(또는 유사한 AI UI 생성 도구)에 붙여넣어 "AI 학생상담 도우미" 웹서비스의 UI 초안을 생성하기 위한 프롬프트다. 실제 코드는 이 초안을 참고해 Next.js + Tailwind CSS + Framer Motion + Lucide Icons로 직접 구현한다(Stitch 산출물은 디자인 레퍼런스 용도).

아래 내용을 그대로 Stitch 입력창에 붙여넣어 사용한다.

---

## Stitch 프롬프트 (전체)

```
Design a clean, professional, trustworthy web application called "AI 학생상담 도우미" (AI Counseling Assistant) for K-12 teachers and school counselors in Korea. The tone should feel calm, supportive, and clinical-but-warm — similar to a modern school administration / EdTech SaaS tool, NOT playful or consumer-social-media styled. Teachers will use this on both desktop (primary, during prep time) and mobile (secondary, for photographing exam papers and counseling logs).

## Brand & Style
- Primary color: a calm, trustworthy blue (e.g. #2563EB range) with a soft neutral gray background (#F8FAFC) and white cards.
- Accent colors used sparingly: green for "positive/good achievement" states, amber for "attention needed", red only for "high-risk / urgent" alerts (used very rarely, high contrast, never decorative).
- Typography: clean sans-serif, generous line-height for long Korean text blocks (counseling comments can be 3-6 sentences).
- Rounded corners (rounded-xl), soft shadows, generous whitespace — avoid dense, cramped layouts since teachers read this under time pressure.
- Use simple line icons throughout (Lucide-icon style: outline, 1.5-2px stroke, no filled/glossy icons).
- Subtle motion cues implied: loading states, fade/slide transitions between steps (describe as gentle, not flashy).

## Global Layout
- Left sidebar navigation (collapsible on mobile into a bottom tab bar) with: Dashboard(대시보드), Students(학생 관리), Counseling Comment Generator(상담 멘트 생성), Exam Analysis(시험지 분석), Counseling Log Analysis(상담일지 분석), Reference Documents(참고자료 관리), Settings(설정).
- Top bar: current teacher name/role, school/class scope indicator, notification bell.
- All AI-generated content areas must include a small "AI 생성 초안 - 검토 후 사용하세요" disclaimer badge and a "근거 문서" (source documents) chip row showing which reference documents were used.

## Screens to design

### 1. Dashboard (대시보드)
- Summary cards: number of students in charge, recent counseling records this week, pending "수동 확인 필요" (needs manual review) OCR flags, any high-risk alerts requiring attention (shown prominently in a red/amber banner if present).
- Recent activity list (recent generated comments, recent uploads).

### 2. Student List & Profile (학생 관리)
- Searchable/filterable student list (by grade/class/name) as a clean table or card grid.
- Student profile page with tabs: 기본정보(Basic Info), 학업(Academic), 교우관계(Relationships), 진로(Career), 상담이력(Counseling History timeline), 시험분석이력(Exam Analysis History).
- Timeline component showing past counseling comments and analyses chronologically, each as a collapsible card with date, type badge (학생용/학부모용/시험분석/상담일지분석), and source document chips.

### 3. Counseling Comment Generator (상담 멘트 생성)
- A form with sections: 학업성적 (grades/trend input, can be simple structured fields or a small table), 교우관계 (free text + tag selector like 갈등/친밀/소외 등), 진로 (희망 진로 dropdown/free text, 적성검사 결과 field).
- Prominent "상담 멘트 생성하기" primary button.
- Loading state: gentle skeleton/pulse animation with text like "학교 참고자료를 검토하고 있어요..." then "상담 멘트를 작성하고 있어요...".
- Result view: two tabs — "학생용 멘트" and "학부모용 멘트" — each in a card with editable textarea, a "출처" section listing referenced documents as small chips, action buttons: 재생성(Regenerate), 편집(Edit), 상담기록으로 저장(Save as record).

### 4. Exam Analysis (시험지 분석)
- Upload zone: drag-and-drop on desktop, big camera-capture button on mobile, with a clear "시험지를 촬영하거나 업로드하세요" prompt and example thumbnail.
- Upload progress → OCR processing state with progress indicator.
- OCR review screen: extracted answer/unit table with a confidence indicator per row (green=high confidence, amber=low confidence needs review), teacher can inline-edit low-confidence cells.
- Analysis result: a unit-by-unit achievement level chart/table (상/중/하 or 성취기준 매핑), a "취약 단원" highlight list, and a generated "성적 향상 방향" comment card with source document chips.

### 5. Counseling Log Analysis (상담일지 분석)
- Same upload flow pattern as Exam Analysis (camera/upload, OCR processing).
- OCR text review screen with an optional "민감정보 마스킹" toggle preview (shows redacted vs raw).
- Analysis result: 고민 주제 태그(tag chips like 학업/교우관계/가족/진로/정서), a risk-level badge (경/중/고, using the green/amber/red system — 고 risk uses a full-width prominent red alert banner ABOVE the AI comment, with text like "전문기관 연계가 필요할 수 있습니다" and a clear call-to-action, visually distinct from the normal AI comment card below it).
- Below the alert (if any): the generated "해결 방향" comment card with source document chips, same edit/regenerate/save actions as other screens.

### 6. Reference Documents / RAG Management (참고자료 관리) — admin view
- A document library table: title, category (성취기준/상담매뉴얼/평가루브릭/위기대응지침), version, last indexed date, status (색인 완료/색인 중/오류).
- Upload button with drag-and-drop for PDF/DOCX/TXT.
- Simple indicator of chunk count per document (for transparency into what the AI can "see").

### 7. Settings (설정)
- Teacher profile, class/grade scope display (read-only, admin-managed), notification preferences, data retention info text.

## Interaction & Motion notes (for reference, actual implementation uses Framer Motion)
- Step transitions (upload → processing → result) should feel like a gentle horizontal slide or fade, ~200-300ms.
- Risk alert banners should have a subtle attention-drawing entrance (fade+slight scale) but must NOT auto-dismiss.
- Buttons and cards use small hover/tap scale feedback (subtle, professional, not bouncy).

## Accessibility
- All color-coded states (confidence, achievement level, risk level) must ALSO be conveyed with text labels/icons, not color alone.
- Sufficient contrast for long-form Korean text reading.

Generate: desktop layouts for Dashboard, Student Profile, Counseling Comment Generator (result view), Exam Analysis (result view), Counseling Log Analysis (result view with high-risk alert state); and mobile layouts for the Exam Analysis upload flow and Counseling Log Analysis upload flow.
```

---

## 사용 방법
1. 위 코드 블록 전체를 Stitch에 붙여넣는다.
2. Stitch가 생성한 화면 중 데스크톱 대시보드/학생 프로필/결과 화면, 모바일 업로드 플로우를 우선적으로 검토한다.
3. 생성된 디자인의 색상/타이포/여백 값을 `tailwind.config`의 커스텀 토큰(예: `colors.brand`, `colors.risk.low/mid/high`)으로 옮겨 실제 컴포넌트 구현에 반영한다.
4. Stitch 산출물은 참고용 목업이며, 실제 컴포넌트는 [CLAUDE.md](../CLAUDE.md)의 클린 아키텍처 규칙에 따라 `components/`와 `app/`에 직접 구현한다.
