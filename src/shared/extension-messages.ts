import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';

export const CHAT_COMPLETION_MESSAGE_TYPE = 'moodloviny:chat-completion';
export const MAX_WORD_LIMIT_TOKENS = 350;

export type ChatCompletionRequestPayload = {
  apiKey: string;
  baseURL?: string;
  timeoutMs?: number;
  body: ChatCompletionCreateParamsNonStreaming | Record<string, unknown>;
};

export type ChatCompletionRequestMessage = {
  type: typeof CHAT_COMPLETION_MESSAGE_TYPE;
  payload: ChatCompletionRequestPayload;
};

export type ChatCompletionResponse =
  | {
      ok: true;
      data: Record<string, any>;
    }
  | {
      ok: false;
      error: string;
      status?: number;
    };

export function sendRuntimeMessage<TResponse>(message: ChatCompletionRequestMessage): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve(response as TResponse);
    });
  });
}
