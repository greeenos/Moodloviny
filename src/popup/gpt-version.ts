import OpenAI from 'openai';
import {
  CHAT_COMPLETION_MESSAGE_TYPE,
  ChatCompletionRequestMessage,
  ChatCompletionResponse,
  sendRuntimeMessage
} from 'shared/extension-messages';
import {
  OPENROUTER_RECOMMENDED_FREE_MODELS,
  OPENROUTER_RECOMMENDED_PAID_MODELS,
  getFallbackModelsForProvider,
  getProviderBaseURL,
  getRecommendedModelsForProvider,
  isModelSupportedForProvider,
  normalizeModelId,
  normalizeProvider,
  supportsImageInput
} from 'shared/provider';
import { showMessage } from './utils';

const providerSelector: HTMLSelectElement = document.querySelector('#provider')!;
const apiKeySelector: HTMLInputElement = document.querySelector('#apiKey')!;
const inputModel: HTMLSelectElement = document.querySelector('#model')!;
const imagesIntegrationLine: HTMLInputElement = document.querySelector('#includeImages-line')!;
const baseURLSelector: HTMLInputElement = document.querySelector('#baseURL')!;
const modelTipsElement: HTMLElement = document.querySelector('#model-recommendations')!;
const modelLoadingElement: HTMLElement = document.querySelector('#model-loading')!;

const MODEL_TEST_PROMPT = 'Odpověz jen slovo pong.';
const MODEL_TEST_BATCH_SIZE = 3;
const MODEL_CACHE_STORAGE_KEY = 'moodlovinyModelCache';
const MODEL_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

type ModelCacheEntry = {
  models: string[];
  updatedAt: number;
};

type ModelCacheMap = Record<string, ModelCacheEntry>;

let refreshRequestId = 0;
let lastValidatedKey = '';

function getCurrentProvider() {
  return normalizeProvider(providerSelector.value);
}

function getSelectedModel() {
  return normalizeModelId(inputModel.value || '');
}

function getValidationKey(provider: string, apiKey: string): string {
  const resolvedBaseURL = getProviderBaseURL(provider, baseURLSelector.value);
  return `${provider}|${apiKey}|${resolvedBaseURL}`;
}

async function getPersistentModelCache(): Promise<ModelCacheMap> {
  const stored = await chrome.storage.local.get([MODEL_CACHE_STORAGE_KEY]);
  return (stored[MODEL_CACHE_STORAGE_KEY] as ModelCacheMap | undefined) || {};
}

async function getCachedModels(validationKey: string): Promise<string[] | null> {
  const cache = await getPersistentModelCache();
  const entry = cache[validationKey];

  if (!entry) return null;

  const isExpired = Date.now() - entry.updatedAt > MODEL_CACHE_TTL_MS;
  if (isExpired) {
    delete cache[validationKey];
    await chrome.storage.local.set({
      [MODEL_CACHE_STORAGE_KEY]: cache
    });
    return null;
  }

  return entry.models;
}

async function setCachedModels(validationKey: string, models: string[]): Promise<void> {
  const cache = await getPersistentModelCache();
  cache[validationKey] = {
    models,
    updatedAt: Date.now()
  };

  await chrome.storage.local.set({
    [MODEL_CACHE_STORAGE_KEY]: cache
  });
}

function prioritizeModels(models: string[], provider: string): string[] {
  const normalizedModels = models.map(model => normalizeModelId(model));
  const uniqueModels = Array.from(new Set(normalizedModels));

  if (provider !== 'openrouter') {
    const recommended = getRecommendedModelsForProvider(provider).map(normalizeModelId);
    const recommendedFirst = recommended.filter(model => uniqueModels.includes(model));
    const remaining = uniqueModels.filter(model => !recommendedFirst.includes(model));
    return [...recommendedFirst, ...remaining];
  }

  const freeModels = uniqueModels.filter(model => {
    const lower = model.toLowerCase();
    return lower.endsWith(':free') || lower === 'openrouter/free';
  });

  const paidModels = uniqueModels.filter(model => !freeModels.includes(model));

  const recommendedFreeFirst = OPENROUTER_RECOMMENDED_FREE_MODELS.map(normalizeModelId).filter(model =>
    freeModels.includes(model)
  );
  const recommendedPaid = OPENROUTER_RECOMMENDED_PAID_MODELS.map(normalizeModelId).filter(model =>
    paidModels.includes(model)
  );

  const remainingFree = freeModels.filter(model => !recommendedFreeFirst.includes(model)).sort();
  const remainingPaid = paidModels.filter(model => !recommendedPaid.includes(model)).sort();

  return [...recommendedFreeFirst, ...remainingFree, ...recommendedPaid, ...remainingPaid];
}

function setModelsList(models: string[], preferredModel?: string) {
  inputModel.innerHTML = '';

  const uniqueModels = Array.from(new Set(models.map(model => normalizeModelId(model))));

  if (uniqueModels.length === 0) {
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Žádný ověřený model';
    inputModel.appendChild(emptyOption);
    inputModel.disabled = true;
    inputModel.value = '';
    return;
  }

  inputModel.disabled = false;

  for (const model of uniqueModels) {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    inputModel.appendChild(option);
  }

  const selectedModel = preferredModel && uniqueModels.includes(normalizeModelId(preferredModel))
    ? normalizeModelId(preferredModel)
    : uniqueModels[0];
  inputModel.value = selectedModel;
}

function setModelLoading(isLoading: boolean, message = 'Načítám modely...') {
  if (isLoading) {
    inputModel.disabled = true;
    inputModel.innerHTML = '';

    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.textContent = message;
    inputModel.appendChild(loadingOption);
    inputModel.value = '';
    modelLoadingElement.textContent = message;
    return;
  }

  modelLoadingElement.textContent = '';
}

function updateModelTips(readyModelCount?: number) {
  if (typeof readyModelCount === 'number') {
    modelTipsElement.textContent = `Dostupné modely: ${readyModelCount}`;
    return;
  }

  modelTipsElement.textContent = '';
}

export function syncBaseURLWithProvider() {
  const provider = getCurrentProvider();
  const providerBaseURL = getProviderBaseURL(provider);

  if (providerBaseURL) {
    baseURLSelector.value = providerBaseURL;
  }
}

export function checkCanIncludeImages() {
  const model = inputModel.value;
  if (supportsImageInput(model)) {
    imagesIntegrationLine.style.display = 'flex';
  } else {
    imagesIntegrationLine.style.display = 'none';
  }
}

function getTestTokenField(provider: string): 'max_tokens' | 'max_completion_tokens' {
  return provider === 'gemini' || provider === 'openrouter' ? 'max_tokens' : 'max_completion_tokens';
}

function buildModelTestBody(provider: string, model: string): Record<string, unknown> {
  return {
    model,
    messages: [{ role: 'user', content: MODEL_TEST_PROMPT }],
    [getTestTokenField(provider)]: 1
  };
}

async function testModel(provider: string, apiKey: string, model: string): Promise<boolean> {
  const response = await sendRuntimeMessage<ChatCompletionResponse>({
    type: CHAT_COMPLETION_MESSAGE_TYPE,
    payload: {
      apiKey,
      baseURL: getProviderBaseURL(provider, baseURLSelector.value),
      timeoutMs: 10_000,
      body: buildModelTestBody(provider, model)
    }
  });

  return response.ok;
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  handler: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await handler(items[currentIndex]);
    }
  });

  await Promise.all(workers);
  return results;
}

async function filterReadyModels(models: string[], provider: string, apiKey: string): Promise<string[]> {
  const normalizedModels = Array.from(new Set(models.map(model => normalizeModelId(model))));
  const results = await runWithConcurrency(normalizedModels, MODEL_TEST_BATCH_SIZE, async model => ({
    model,
    ready: await testModel(provider, apiKey, model)
  }));

  return results.filter(result => result.ready).map(result => result.model);
}

async function fetchOpenRouterModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://moodloviny.example.com',
        'X-Title': 'Moodloviny'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch OpenRouter models');

    const data = await response.json();
    if (!Array.isArray(data.data)) return [];

    return data.data
      .filter((model: any) => typeof model.id === 'string' && model.id.length > 0)
      .map((model: any) => model.id as string);
  } catch {
    return getFallbackModelsForProvider('openrouter');
  }
}

async function getCandidateModels(provider: string, apiKey: string): Promise<string[]> {
  if (provider === 'claude') {
    return prioritizeModels(getFallbackModelsForProvider(provider), provider);
  }

  if (provider === 'openrouter') {
    return prioritizeModels(await fetchOpenRouterModels(apiKey), provider);
  }

  const baseURL = getProviderBaseURL(provider, baseURLSelector.value);
  const client = new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true
  });

  const response = await client.models.list();
  const models = response.data
    .map(model => normalizeModelId(model.id))
    .filter(model => isModelSupportedForProvider(model, provider));

  return prioritizeModels(models.length > 0 ? models : getFallbackModelsForProvider(provider), provider);
}

export async function populateDatalistWithGptVersions() {
  const requestId = ++refreshRequestId;
  const provider = getCurrentProvider();
  const apiKey = apiKeySelector.value?.trim();
  const preferredModel = getSelectedModel();

  if (!apiKey) {
    lastValidatedKey = '';
    setModelLoading(false);
    const fallbackModels = prioritizeModels(getFallbackModelsForProvider(provider), provider);
    setModelsList(fallbackModels, preferredModel);
    updateModelTips();
    checkCanIncludeImages();
    return;
  }

  const validationKey = getValidationKey(provider, apiKey);
  const hasLoadedModels = inputModel.options.length > 0;
  if (validationKey === lastValidatedKey && hasLoadedModels) {
    setModelLoading(false);
    updateModelTips(inputModel.options.length);
    checkCanIncludeImages();
    return;
  }

  const cachedModels = await getCachedModels(validationKey);
  if (cachedModels && cachedModels.length > 0) {
    const orderedCachedModels = prioritizeModels(cachedModels, provider);
    setModelLoading(false);
    setModelsList(orderedCachedModels, preferredModel);
    lastValidatedKey = validationKey;
    updateModelTips(orderedCachedModels.length);
    checkCanIncludeImages();
    showMessage({ msg: 'Modely načteny z uložené cache.', isError: false });
    return;
  }

  setModelLoading(true);
  showMessage({ msg: 'Testuji a filtruji modely...', isInfinite: true, isError: false });

  try {
    const candidateModels = await getCandidateModels(provider, apiKey);
    if (requestId !== refreshRequestId) return;

    const readyModels = await filterReadyModels(candidateModels, provider, apiKey);
    if (requestId !== refreshRequestId) return;

    const orderedReadyModels = prioritizeModels(readyModels, provider);
    setModelLoading(false);
    setModelsList(orderedReadyModels, preferredModel);
    await setCachedModels(validationKey, orderedReadyModels);
    lastValidatedKey = validationKey;
    updateModelTips(orderedReadyModels.length);
    checkCanIncludeImages();

    if (orderedReadyModels.length === 0) {
      showMessage({ msg: 'Nepodařilo se ověřit žádný model.', isError: true });
      return;
    }

    showMessage({ msg: `Připraveno ${orderedReadyModels.length} ověřených modelů.`, isError: false });
  } catch (err: any) {
    if (requestId !== refreshRequestId) return;

    lastValidatedKey = '';
    setModelLoading(false);
    const fallbackModels = prioritizeModels(getFallbackModelsForProvider(provider), provider);
    setModelsList(fallbackModels, preferredModel);
    updateModelTips();
    checkCanIncludeImages();
    showMessage({ msg: String(err?.message ?? err), isError: true });
  }
}

inputModel.addEventListener('change', () => {
  checkCanIncludeImages();

  if (apiKeySelector.value?.trim()) {
    void checkModel();
  }
});

providerSelector.addEventListener('change', () => {
  syncBaseURLWithProvider();
  updateModelTips();
  checkCanIncludeImages();

  if (apiKeySelector.value?.trim()) {
    void populateDatalistWithGptVersions();
  } else {
    setModelLoading(false);
    setModelsList(prioritizeModels(getFallbackModelsForProvider(getCurrentProvider()), getCurrentProvider()));
  }
});

apiKeySelector.addEventListener('change', () => {
  void populateDatalistWithGptVersions();
});

export async function checkModel() {
  const provider = getCurrentProvider();
  const model = getSelectedModel();
  const apiKey = apiKeySelector.value?.trim();

  if (!model || !apiKey) {
    showMessage({ msg: 'Prosím, vyplňte všechna pole', isError: true });
    return;
  }

  try {
    showMessage({ msg: 'Ověřuji model...', isInfinite: true, isError: false });

    const response = await sendRuntimeMessage<ChatCompletionResponse>({
      type: CHAT_COMPLETION_MESSAGE_TYPE,
      payload: {
        apiKey,
        baseURL: getProviderBaseURL(provider, baseURLSelector.value),
        timeoutMs: 10_000,
        body: buildModelTestBody(provider, model)
      }
    });

    if (!response.ok) {
      throw new Error(response.error);
    }

    showMessage({ msg: 'Model je funkční!' });
  } catch (err: any) {
    showMessage({ msg: String(err?.message ?? err), isError: true });
  }
}

const checkModelBtn: HTMLElement = document.querySelector('#check-model')!;
checkModelBtn.addEventListener('click', checkModel);

updateModelTips();