import {
  CHAT_COMPLETION_MESSAGE_TYPE,
  ChatCompletionRequestMessage,
  ChatCompletionRequestPayload,
  ChatCompletionResponse
} from 'shared/extension-messages';
import { getFallbackModelsForProvider, normalizeModelId } from 'shared/provider';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_TIMEOUT_MS = 20_000;
const RETRYABLE_GEMINI_STATUSES = new Set([404, 429]);
const MAX_GEMINI_RETRIES = 3;

class HTTPError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

function normalizeBaseURL(baseURL?: string): string {
  if (!baseURL) return OPENAI_BASE_URL;
  return baseURL.replace(/\/+$/, '');
}

function safelyParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function getAPIErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'object' && data !== null) {
    const maybeError = (data as Record<string, any>).error;
    if (typeof maybeError === 'string') {
      return maybeError;
    }

    if (typeof maybeError === 'object' && maybeError !== null) {
      const message = (maybeError as Record<string, any>).message;
      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }

    const raw = (data as Record<string, any>).raw;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }
  }

  if (status === 429) {
    return '429 rate limit or quota exceeded for the selected model';
  }

  if (status === 404) {
    return '404 model or endpoint not found for the selected model';
  }

  return `${status} status code (no body)`;
}

function getBodyModel(payload: ChatCompletionRequestPayload): string {
  const model = (payload.body as Record<string, unknown>)?.model;
  if (typeof model !== 'string') return '';

  return normalizeModelId(model);
}

function withBodyModel(payload: ChatCompletionRequestPayload, model: string): ChatCompletionRequestPayload {
  return {
    ...payload,
    body: {
      ...(payload.body as Record<string, unknown>),
      model
    }
  };
}

function isGeminiRequest(payload: ChatCompletionRequestPayload): boolean {
  return normalizeBaseURL(payload.baseURL).includes('generativelanguage.googleapis.com');
}

function isOpenRouterRequest(payload: ChatCompletionRequestPayload): boolean {
  return normalizeBaseURL(payload.baseURL).includes('openrouter.ai/api/v1');
}

function getRetryModels(payload: ChatCompletionRequestPayload, status: number): string[] {
  const currentModel = getBodyModel(payload);
  const models = getFallbackModelsForProvider('gemini')
    .map(model => normalizeModelId(model))
    .filter(model => model && model !== currentModel);

  if (status !== 429) {
    return models.slice(0, MAX_GEMINI_RETRIES);
  }

  const flashModels = models.filter(model => model.includes('flash'));
  const nonFlashModels = models.filter(model => !model.includes('flash'));

  return [...flashModels, ...nonFlashModels].slice(0, MAX_GEMINI_RETRIES);
}

function isChatCompletionMessage(message: unknown): message is ChatCompletionRequestMessage {
  if (!message || typeof message !== 'object') return false;

  const typedMessage = message as Record<string, unknown>;
  const payload = typedMessage.payload as ChatCompletionRequestPayload;

  return (
    typedMessage.type === CHAT_COMPLETION_MESSAGE_TYPE &&
    !!payload &&
    typeof payload.apiKey === 'string' &&
    payload.apiKey.length > 0
  );
}

async function createChatCompletion(payload: ChatCompletionRequestPayload): Promise<Record<string, any>> {
  async function execute(requestPayload: ChatCompletionRequestPayload): Promise<Record<string, any>> {
    const controller = new AbortController();
    const timeoutMs =
      requestPayload.timeoutMs && requestPayload.timeoutMs > 0
        ? requestPayload.timeoutMs
        : DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${normalizeBaseURL(requestPayload.baseURL)}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${requestPayload.apiKey}`,
          'Content-Type': 'application/json',
          ...(isOpenRouterRequest(requestPayload)
            ? {
                'HTTP-Referer': 'https://github.com/greeenos/Moodloviny',
                'X-Title': 'Moodloviny'
              }
            : {})
        },
        body: JSON.stringify(requestPayload.body),
        signal: controller.signal
      });

      const responseText = await response.text();
      const responseData = responseText ? safelyParseJson(responseText) : null;

      if (!response.ok) {
        throw new HTTPError(response.status, getAPIErrorMessage(responseData, response.status));
      }

      if (!responseData || typeof responseData !== 'object') {
        throw new Error('API response is empty');
      }

      return responseData as Record<string, any>;
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('API request timed out');
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  try {
    return await execute(payload);
  } catch (error: unknown) {
    if (
      !(error instanceof HTTPError) ||
      !isGeminiRequest(payload) ||
      !RETRYABLE_GEMINI_STATUSES.has(error.status)
    ) {
      throw error;
    }

    const retryModels = getRetryModels(payload, error.status);
    if (retryModels.length === 0) throw error;

    let latestError: unknown = error;

    for (const model of retryModels) {
      try {
        return await execute(withBodyModel(payload, model));
      } catch (retryError: unknown) {
        latestError = retryError;

        if (!(retryError instanceof HTTPError)) {
          throw retryError;
        }

        if (!RETRYABLE_GEMINI_STATUSES.has(retryError.status)) {
          throw retryError;
        }
      }
    }

    throw latestError;
  }
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isChatCompletionMessage(message)) return;

  createChatCompletion(message.payload)
    .then(data => {
      sendResponse({ ok: true, data } as ChatCompletionResponse);
    })
    .catch((error: unknown) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        status: error instanceof HTTPError ? error.status : undefined
      } as ChatCompletionResponse);
    });

  return true;
});
