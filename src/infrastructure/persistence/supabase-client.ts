import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../../lib/env";

let cachedClient: SupabaseClient | null = null;

/**
 * 서버 전용 Supabase 클라이언트(Service Role Key 사용). 브라우저에 노출 금지.
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
  }
  return cachedClient;
}
