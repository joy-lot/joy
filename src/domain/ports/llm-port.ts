export interface LlmCompletionRequest {
  prompt: string;
  temperature?: number;
}

export interface LlmPort {
  complete(request: LlmCompletionRequest): Promise<string>;
}
