import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * 골든 데이터셋 회귀 하네스 / RAG 검색 품질 하네스 전용 설정 (CLAUDE.md 3.2, 3.3).
 * 실제 Ollama 서버 및 Supabase 연결이 필요하므로 기본 `npm run test`에서는 제외하고
 * `npm run test:golden` / `npm run test:rag-eval`로 별도 실행한다.
 */
export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 60_000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
