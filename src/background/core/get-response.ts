import type Config from '../types/config';
import type GPTAnswer from '../types/gpt-answer';
import normalizeText from 'background/utils/normalize-text';
import getContentWithHistory from './get-content-with-history';
import { fixeO } from '../utils/fixe-o';
import { ChatCompletionMessageParam } from 'openai/resources';
import { getProviderBaseURL, normalizeModelId, normalizeProvider } from 'shared/provider';
import {
  MAX_WORD_LIMIT_TOKENS,
  CHAT_COMPLETION_MESSAGE_TYPE,
  ChatCompletionRequestMessage,
  ChatCompletionResponse,
  sendRuntimeMessage
} from 'shared/extension-messages';

function createCompletionPayload(config: Config, messages: ChatCompletionMessageParam[]) {
  const model = normalizeModelId(config.model);
  const configuredMaxTokens = config.maxTokens || 2000;
  const maxTokens = Math.min(configuredMaxTokens, MAX_WORD_LIMIT_TOKENS);
  const provider = normalizeProvider(config.provider);

  const payload = fixeO(model, {
    model,
    messages,
    max_completion_tokens: maxTokens
  });

  // Gemini and OpenRouter use max_tokens instead of max_completion_tokens
  if (provider === 'gemini' || provider === 'openrouter') {
    const adjusted: any = { ...payload, max_tokens: maxTokens };
    delete adjusted.max_completion_tokens;
    return adjusted;
  }

  return payload;
}

function extractResponseText(content: unknown): string {
  if (typeof content === 'string') return content;

  if (!Array.isArray(content)) return '';

  return content
    .map(part => {
      if (typeof part === 'string') return part;

      if (typeof part === 'object' && part !== null) {
        const text = (part as { text?: unknown }).text;
        if (typeof text === 'string') return text;
      }

      return '';
    })
    .filter(Boolean)
    .join('\n')
    .trim();
}

/**
 * Get the response from chatGPT api
 * @param config
 * @param question
 * @returns
 */
async function getChatGPTResponse(
  config: Config,
  questionElement: HTMLElement,
  question: string
): Promise<GPTAnswer> {
  const contentHandler = await getContentWithHistory(config, questionElement, question);
  const provider = normalizeProvider(config.provider);
  const req = await sendRuntimeMessage<ChatCompletionResponse>({
    type: CHAT_COMPLETION_MESSAGE_TYPE,
    payload: {
      apiKey: config.apiKey,
      baseURL: getProviderBaseURL(provider, config.baseURL),
      timeoutMs: config.timeout ? 20_000 : undefined,
      body: createCompletionPayload(config, contentHandler.messages)
    }
  });

  if (!req.ok) {
    throw new Error(req.error);
  }

  const response = extractResponseText(req.data.choices?.[0]?.message?.content ?? '');

  if (typeof contentHandler.saveResponse === 'function') contentHandler.saveResponse(response);

  return {
    question,
    response,
    normalizedResponse: normalizeText(response)
  };
}

export default getChatGPTResponse;
