export interface OcrLine {
  text: string;
  confidence: number;
}

export interface OcrResult {
  fullText: string;
  lines: OcrLine[];
}

export interface OcrPort {
  extractText(imageBuffer: Buffer): Promise<OcrResult>;
}
