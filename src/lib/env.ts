function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`환경변수 ${name}가 설정되지 않았습니다. .env.local을 확인하세요.`);
  }
  return value;
}

export const env = {
  get ollamaBaseUrl() {
    return readEnv("OLLAMA_BASE_URL", "http://localhost:11434");
  },
  get ollamaModel() {
    return readEnv("OLLAMA_MODEL", "qwen2.5:2b");
  },
  get ollamaEmbeddingModel() {
    return readEnv("OLLAMA_EMBEDDING_MODEL", "qwen2.5:2b");
  },
  get supabaseUrl() {
    return readEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return readEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
};
