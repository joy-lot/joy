export interface ChunkTextOptions {
  chunkSize?: number;
  overlap?: number;
}

/**
 * 긴 문서를 RAG 색인을 위한 청크로 분할한다(문자 수 기준, 오버랩 포함).
 * 순수 함수이므로 도메인 계층에 위치하며 외부 의존성이 없다.
 */
export function chunkText(
  text: string,
  { chunkSize = 700, overlap = 100 }: ChunkTextOptions = {},
): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [];
  }
  if (chunkSize <= 0) {
    throw new Error("chunkSize는 0보다 커야 합니다.");
  }
  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error("overlap은 0 이상이면서 chunkSize보다 작아야 합니다.");
  }

  const chunks: string[] = [];
  const step = chunkSize - overlap;
  for (let start = 0; start < trimmed.length; start += step) {
    const chunk = trimmed.slice(start, start + chunkSize).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    if (start + chunkSize >= trimmed.length) {
      break;
    }
  }
  return chunks;
}
