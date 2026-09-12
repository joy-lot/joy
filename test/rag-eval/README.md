# RAG 검색 품질 하네스

`document_chunks` 색인/임베딩 모델을 바꿀 때마다, 알려진 (질의, 기대 근거 문서) 쌍에 대해
검색 결과 top-k 안에 기대 문서가 포함되는지(recall) 확인하기 위한 하네스다.

## 실행 방법
1. Supabase에 `documents`/`document_chunks`가 색인되어 있어야 한다.
2. `.env.local`에 Supabase, Ollama 임베딩 설정을 채운다.
3. `RUN_RAG_EVAL=1 npm run test:rag-eval`

## 질의 세트 추가 방법
`queries.json`에 `{ query, expectedDocumentTitle }` 쌍을 추가한다. 실제 문서 제목/등록
문서에 맞춰 갱신해야 한다(현재 값은 예시 placeholder).
