# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(및 다른 AI 코딩 에이전트)를 위한 프로젝트 규칙이다. 제품 요구사항의 상세는 [PRD.md](./PRD.md)를 참조한다. 이 문서와 PRD가 충돌하면 PRD가 "무엇을 만들지"의 근거이고, 이 문서는 "어떻게 만들지"의 근거다.

## 프로젝트 한 줄 요약
학생 기본정보/시험지 사진/상담일지 사진을 입력받아, 로컬 Ollama(Qwen) LLM과 사내 문서 기반 RAG로 전문적인 학생·학부모 상담 멘트를 생성하는 Next.js 웹 서비스.

## 기술 스택 (변경 금지, 대체 라이브러리 임의 도입 금지)
- Next.js (App Router, TypeScript strict mode)
- Tailwind CSS
- Framer Motion
- Lucide Icons
- Supabase (Postgres + pgvector, Storage, Auth, RLS)
- Ollama (Qwen 2.5 계열 소형 모델, 로컬 추론)
- 배포: Vercel (단, Ollama 서버는 Vercel에 배포하지 않는다 — 별도 API 경유로 호출)

---

## 1. 아키텍처: 클린 아키텍처 (필수)

계층은 안쪽(도메인)에서 바깥쪽(프레임워크)으로만 의존한다. 역방향 의존 금지.

```
src/
  domain/                # 순수 비즈니스 로직. Next.js/Supabase/Ollama 몰라야 함.
    entities/            # Student, ExamUpload, CounselingLog, CounselingComment ...
    value-objects/        # AchievementLevel, RiskLevel, ConcernCategory ...
    ports/                 # interface: LlmPort, OcrPort, VectorSearchPort, StudentRepositoryPort ...
    services/             # 순수 도메인 서비스 (위험도 판정 규칙 등)

  application/            # 유스케이스. domain의 port에만 의존.
    use-cases/
      generate-counseling-comment/
      analyze-exam-upload/
      analyze-counseling-log/
      ingest-document/       # RAG 문서 색인

  infrastructure/          # port의 실제 구현체. 프레임워크/외부 SDK 의존 허용.
    llm/ollama-llm-adapter.ts        # implements LlmPort
    ocr/ocr-adapter.ts               # implements OcrPort
    rag/supabase-vector-search.ts    # implements VectorSearchPort
    persistence/supabase-student-repository.ts
    persistence/supabase-document-repository.ts

  app/                     # Next.js App Router (라우팅, 서버 액션, UI)
    (routes)/...
    api/...                # 필요한 경우에만; 우선 Server Actions로 use-case 호출

  components/              # 프레젠테이션 컴포넌트 (Tailwind + Framer Motion + Lucide)
  lib/                     # 공용 유틸(순수 함수), DI 컨테이너 조립 지점
```

### 규칙
1. `domain/`은 어떤 npm 패키지도 import하지 않는다(순수 TypeScript만). 예외: 타입 전용 유틸.
2. `application/`의 유스케이스는 생성자/함수 인자로 `port` 인터페이스를 주입받는다(의존성 주입). 구체 구현(`OllamaLlmAdapter` 등)을 직접 import하지 않는다.
3. `infrastructure/`의 어댑터만 Supabase 클라이언트, `fetch`(Ollama HTTP API), OCR 라이브러리를 import할 수 있다.
4. `app/`(Next.js 레이어)는 조립(composition root) 역할만 한다 — use-case를 인스턴스화하고 어댑터를 주입한 뒤 호출, UI 렌더링. 비즈니스 로직을 페이지/서버 액션에 직접 작성하지 않는다.
5. 새로운 외부 의존성(새 OCR 라이브러리 등)을 도입할 때는 반드시 `domain/ports`에 인터페이스를 먼저 정의하고 `infrastructure/`에 어댑터로 감싼다.

---

## 2. TDD (필수 워크플로우)

이 프로젝트는 **테스트 우선(Red-Green-Refactor)**을 기본 개발 방식으로 한다.

1. **Red**: `domain/`, `application/` 코드를 작성하기 전에 실패하는 테스트를 먼저 작성한다.
2. **Green**: 테스트를 통과시키는 최소 구현을 작성한다.
3. **Refactor**: 테스트가 초록불인 상태를 유지하며 리팩터링한다.

### 테스트 대상 우선순위
- `domain/services`, `domain/value-objects`: 100%에 가까운 커버리지 목표(위험도 판정, 성취수준 계산 등 규칙이 몰려 있음).
- `application/use-cases`: port를 Fake/Mock으로 대체해 유스케이스 오케스트레이션 로직을 검증.
- `infrastructure/`: 실제 외부 연동은 별도의 **통합 테스트**(마킹하여 분리 실행)로 검증하고, 단위 테스트에서는 어댑터의 계약(contract) 준수만 확인.
- `components/`: 주요 사용자 플로우(업로드 → 로딩 → 결과 표시)는 컴포넌트/E2E 테스트로 커버.

### 실행 명령 (제안 — package.json에 스캐폴딩 시 반영)
```bash
npm run test          # 단위 테스트 (domain, application)
npm run test:watch    # TDD 루프용 watch 모드
npm run test:integration  # infrastructure 통합 테스트 (Supabase/Ollama 실제 연동, CI에서만 상시 실행)
npm run test:e2e      # 주요 사용자 플로우 E2E
```

새 기능을 추가할 때는 반드시 해당 use-case의 테스트 파일을 먼저 작성/수정한 뒤 구현 코드를 수정한다. 테스트 없이 `application/`, `domain/`에 로직을 추가하지 않는다.

---

## 3. 하네스 엔지니어링 (Harness Engineering)

LLM(Ollama Qwen)과 OCR은 비결정적이거나 외부 시스템에 의존하므로, 일반적인 단위 테스트만으로는 품질을 보장할 수 없다. 다음 전용 테스트 하네스를 구축하고 유지보수한다.

### 3.1 Fake LLM 어댑터 (`test/fakes/fake-llm-adapter.ts`)
- `LlmPort`를 구현하되, 입력 프롬프트 해시에 따라 미리 정의된 결정론적 응답을 반환.
- 유스케이스 단위 테스트는 항상 이 Fake를 사용 — 실제 Ollama 서버가 없어도 전체 스위트가 통과해야 한다.

### 3.2 골든 데이터셋 회귀 하네스 (`test/golden/`)
- 실제(또는 대표) 입력 시나리오(학생 정보 조합, 시험지 OCR 텍스트, 상담일지 OCR 텍스트) 세트를 고정 파일로 저장.
- 각 시나리오에 대해 Ollama Qwen 실호출 결과를 저장해두고, 이후 프롬프트/모델 변경 시 diff를 사람이 리뷰하는 **스냅샷 승인 테스트**를 운용(자동 pass/fail이 아니라 변경 감지 목적).
- 실행: `npm run test:golden` (CI에서는 옵션, 로컬에서 프롬프트 변경 시 수동 실행 권장).

### 3.3 RAG 검색 품질 하네스 (`test/rag-eval/`)
- (질의, 기대 근거 문서 ID) 쌍 목록을 유지.
- 벡터 검색 결과의 top-k 안에 기대 문서가 포함되는지 recall을 측정하는 스크립트 제공.
- `document_chunks` 재색인 로직이나 임베딩 모델을 바꿀 때마다 이 하네스로 회귀를 확인한다.

### 3.4 고위험 감지 회귀 하네스 (`test/safety/`)
- 자해/학대/폭력 등 고위험 키워드가 포함된 상담일지 샘플(가상 데이터만 사용, 실제 학생 데이터 절대 사용 금지)에 대해 시스템이 반드시 "전문기관 연계 필요" 경고를 우선 노출하는지 검증.
- 이 하네스는 **회귀 시 빌드를 실패시키는 필수(critical) 테스트**로 취급한다 — 다른 테스트보다 우선순위가 높다.

### 3.5 OCR 신뢰도 하네스 (`test/ocr-fixtures/`)
- 인쇄체/손글씨 샘플 이미지(익명화된 더미 데이터)와 기대 추출 텍스트를 고정하여 OCR 어댑터 교체 시 회귀를 감지.

---

## 4. AI/LLM 연동 규칙 (Ollama Qwen)

- 모든 LLM 호출은 `domain/ports/llm-port.ts`의 `LlmPort` 인터페이스를 통해서만 이루어진다. 페이지/컴포넌트에서 Ollama HTTP API를 직접 호출하지 않는다.
- `infrastructure/llm/ollama-llm-adapter.ts`가 실제 Ollama 서버(`OLLAMA_BASE_URL`, 기본 `http://localhost:11434`)와 통신하며, 모델명은 환경변수 `OLLAMA_MODEL`(기본값: Qwen 2.5 소형 모델)로 설정한다.
- 프롬프트 템플릿은 `application/use-cases/*/prompts/`에 순수 함수(`buildPrompt(input, ragContext): string`)로 분리하여 테스트 가능하게 한다. 템플릿 문자열을 컴포넌트나 API 라우트에 하드코딩하지 않는다.
- 세 가지 유스케이스별로 별도 프롬프트 전략을 명확히 분리한다:
  1. `generate-counseling-comment`: 학생 기본정보 → 학생용/학부모용 톤 분리, 상담 전문 용어 사용 지시.
  2. `analyze-exam-upload`: OCR 결과 + 성취기준 RAG 컨텍스트 → 단원별 성취수준 + 향상 방향.
  3. `analyze-counseling-log`: OCR 결과 + 상담 매뉴얼 RAG 컨텍스트 → 고민 분류 + 위험도 + 해결 방향. **위험도 판정은 LLM 출력만 신뢰하지 않고 `domain/services`의 규칙 기반 키워드 필터와 병행(LLM+룰 하이브리드)하여 고위험 누락을 방지한다.**
- LLM 응답은 항상 구조화된 형식(JSON)으로 받도록 프롬프트를 설계하고, 파싱 실패 시 재시도(최대 1회) 후 실패 처리 UI를 명확히 보여준다.
- 학생 개인정보 원문을 로그에 평문으로 남기지 않는다(디버그 로그에도 마스킹 적용).

## 5. RAG 연동 규칙 (Documents)

- 참고 문서는 저장소 루트의 `Documents/`(관리자 업로드 UI를 통해 Supabase Storage에 최종 저장; 로컬 `Documents/`는 초기 시드/개발용 샘플 자료 용도)에 둔다.
- 색인 파이프라인: `application/use-cases/ingest-document` → 텍스트 추출 → 청크 분할(기본 500~800 토큰, 오버랩 100) → 임베딩 생성 → `document_chunks`(pgvector) upsert.
- 검색은 `domain/ports/vector-search-port.ts`의 `VectorSearchPort.search(query, topK)`를 통해서만 수행.
- 모든 AI 생성 응답에는 사용된 `document_chunks`의 출처(`documents.title`)를 함께 반환해 UI에 인용 배지로 표시한다. 근거 문서가 전혀 검색되지 않을 경우, 그 사실을 응답에 명시하고 "일반 원칙 기반 초안이며 근거 문서 확인 필요"라는 경고를 포함한다.

## 6. 데이터/보안 규칙

- 실제 학생 개인정보를 로컬 시드 데이터, 테스트 픽스처, 커밋 메시지, 골든 데이터셋에 절대 사용하지 않는다 — 항상 가상 인물로 anonymize.
- Supabase RLS 정책 없이 새 테이블을 추가하지 않는다(교사의 학년/반 접근 범위 제한 필수).
- `.env.local`에 `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 등을 정의하고 저장소에 커밋하지 않는다.

## 7. 코딩 컨벤션

- TypeScript strict, `any` 사용 금지(불가피한 경우 이유를 주석 없이 타입 단언으로 최소화).
- 컴포넌트는 Tailwind 유틸리티 클래스 우선, 커스텀 CSS 최소화.
- 아이콘은 `lucide-react`만 사용, 애니메이션은 `framer-motion`만 사용(다른 애니메이션 라이브러리 도입 금지).
- 커밋 전 반드시 `npm run test`, `npm run lint`, `npm run typecheck` 통과.
- 과설계 금지: 요구사항에 없는 추상화, 훅, 설정 옵션을 미리 만들지 않는다(YAGNI). 클린 아키텍처의 계층 분리는 지키되, 계층 내부는 최대한 단순하게 유지한다.

## 8. 참고 문서
- [PRD.md](./PRD.md) — 제품 요구사항
- [docs/stitch-prompt.md](./docs/stitch-prompt.md) — 프론트엔드(Stitch) 디자인 생성 프롬프트
