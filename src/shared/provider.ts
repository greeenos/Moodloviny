export type Provider = 'openai' | 'gemini' | 'claude' | 'openrouter';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const GEMINI_OPENAI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const GEMINI_FALLBACK_MODELS = [
  'gemini-3.1-pro-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

const OPENAI_FALLBACK_MODELS = [
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
  'o3',
  'gpt-4.1-mini',
];

const CLAUDE_FALLBACK_MODELS = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
];

export const OPENROUTER_RECOMMENDED_FREE_MODELS = [
  'qwen/qwen3-coder:free',
  'openai/gpt-oss-120b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
];

export const OPENROUTER_RECOMMENDED_PAID_MODELS = [
  'anthropic/claude-opus-4.6',
  'anthropic/claude-sonnet-4.6',
  'openai/gpt-5.4',
  'google/gemini-2.5-pro',
  'openai/gpt-5.4-mini',
];

export function getRecommendedModelsForProvider(provider?: string): string[] {
  const normalized = normalizeProvider(provider);
  if (normalized === 'openrouter') {
    return [...OPENROUTER_RECOMMENDED_FREE_MODELS, ...OPENROUTER_RECOMMENDED_PAID_MODELS];
  }

  return getFallbackModelsForProvider(normalized);
}

export function normalizeModelId(model: string): string {
  return model.trim().replace(/^models\//i, '');
}

export function normalizeProvider(provider?: string): Provider {
  if (provider === 'gemini') return 'gemini';
  if (provider === 'claude') return 'claude';
  if (provider === 'openrouter') return 'openrouter';
  return 'openai';
}

export function getProviderBaseURL(provider?: string, baseURL?: string): string | undefined {
  const customBaseURL = baseURL?.trim();

  const normalized = normalizeProvider(provider);
  if (normalized === 'openai') return OPENAI_BASE_URL;
  if (normalized === 'gemini') return GEMINI_OPENAI_BASE_URL;
  if (normalized === 'claude') return ANTHROPIC_BASE_URL;
  if (normalized === 'openrouter') return OPENROUTER_BASE_URL;

  if (customBaseURL) return customBaseURL;
  return undefined;
}

export function supportsImageInput(model: string): boolean {
  const modelName = normalizeModelId(model).toLowerCase();

  if (modelName.startsWith('gemini')) return true;

  const openAIVersion = modelName.match(/gpt-(\d+)/);
  return Number(openAIVersion?.[1] ?? 0) >= 4;
}

export function isModelSupportedForProvider(model: string, provider?: string): boolean {
  const modelName = normalizeModelId(model).toLowerCase();
  const normalized = normalizeProvider(provider);

  if (normalized === 'gemini') return modelName.startsWith('gemini');
  if (normalized === 'claude') return modelName.startsWith('claude');
  if (normalized === 'openrouter') return true; // OpenRouter supports many models
  return modelName.startsWith('gpt') || modelName.startsWith('chatgpt') || /^o\d+/.test(modelName);
}

export function getFallbackModelsForProvider(provider?: string): string[] {
  const normalized = normalizeProvider(provider);
  if (normalized === 'gemini') return [...GEMINI_FALLBACK_MODELS];
  if (normalized === 'claude') return [...CLAUDE_FALLBACK_MODELS];
  if (normalized === 'openrouter') {
    return [...OPENROUTER_RECOMMENDED_FREE_MODELS, ...OPENROUTER_RECOMMENDED_PAID_MODELS];
  }
  return [...OPENAI_FALLBACK_MODELS];
}

export function getDefaultModelForProvider(provider?: string): string {
  return getFallbackModelsForProvider(provider)[0];
}
