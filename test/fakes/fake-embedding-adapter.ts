import type { EmbeddingPort } from "../../src/domain/ports/embedding-port";

/**
 * 결정론적 Fake 임베딩 어댑터. 텍스트 길이 기반의 저차원 가짜 벡터를 반환해
 * 실제 임베딩 모델 없이 파이프라인 오케스트레이션을 검증한다.
 */
export class FakeEmbeddingAdapter implements EmbeddingPort {
  public readonly embeddedTexts: string[] = [];

  async embed(text: string): Promise<number[]> {
    this.embeddedTexts.push(text);
    return [text.length, text.length % 7];
  }
}
