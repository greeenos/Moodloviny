import { globalData, inputsCheckbox, modes } from './data';
import { checkCanIncludeImages, populateDatalistWithGptVersions, syncBaseURLWithProvider } from './gpt-version';
import { handleModeChange } from './mode-handler';
import {
  getProviderBaseURL,
  normalizeModelId,
  normalizeProvider
} from 'shared/provider';
import { MAX_WORD_LIMIT_TOKENS } from 'shared/extension-messages';
import './settings';

import { showMessage } from './utils';

document.querySelector('#close-donate')?.addEventListener('click', () => {
  const banner = document.querySelector('#donate-banner') as HTMLElement | null;
  if (banner) banner.style.display = 'none';
});

const saveBtn = document.querySelector('.save')!;
const providerSelector = document.querySelector('#provider') as HTMLSelectElement;

// inputs id
const inputsText = ['apiKey', 'code', 'model', 'baseURL', 'maxTokens'];

function saveConfig({ silent = false } = {}) {
  const provider = normalizeProvider(providerSelector.value);
  const [apiKey, code, model, baseURL, maxTokens] = inputsText.map(selector =>
    (document.querySelector('#' + selector) as HTMLInputElement).value.trim()
  );
  const parsedMaxTokens = maxTokens ? parseInt(maxTokens) : undefined;
  const cappedMaxTokens = parsedMaxTokens
    ? Math.min(parsedMaxTokens, MAX_WORD_LIMIT_TOKENS)
    : undefined;
  const resolvedModel = normalizeModelId(model);
  const resolvedBaseURL = getProviderBaseURL(provider, baseURL);

  const [logs, title, cursor, typing, mouseover, infinite, timeout, history, includeImages] =
    inputsCheckbox.map(selector => {
      const element: HTMLInputElement = document.querySelector('#' + selector)!;
      return element.checked && element.parentElement!.style.display !== 'none';
    });

  if (!apiKey || !resolvedModel) {
    if (!silent) showMessage({ msg: 'Prosím, vyplňte všechna povinná pole', isError: true });
    return;
  }

  if (code.length > 0 && code.length < 2) {
    if (!silent) showMessage({ msg: 'The code should at least contain 2 characters', isError: true });
    return;
  }

  chrome.storage.sync.set({
    moodloviny: {
      provider,
      apiKey,
      code,
      model: resolvedModel,
      baseURL: resolvedBaseURL,
      maxTokens: cappedMaxTokens,
      logs,
      title,
      cursor,
      typing,
      mouseover,
      infinite,
      timeout,
      history,
      includeImages,
      mode: globalData.actualMode
    }
  });

  if (!silent) showMessage({ msg: 'Configuration saved' });
}

saveBtn.addEventListener('click', () => saveConfig());

// we load back the configuration
chrome.storage.sync.get(['moodloviny']).then(function (storage) {
  const config = storage.moodloviny;

  if (config) {
    providerSelector.value = normalizeProvider(config.provider);

    if (config.mode) {
      globalData.actualMode = config.mode;
      for (const mode of modes) {
        if (mode.value === config.mode) {
          mode.classList.remove('not-selected');
        } else {
          mode.classList.add('not-selected');
        }
      }
    }

    inputsText.forEach(key =>
      config[key]
        ? ((document.querySelector('#' + key) as HTMLInputElement).value = config[key])
        : null
    );
    inputsCheckbox.forEach(
      key => ((document.querySelector('#' + key) as HTMLInputElement).checked = config[key] || '')
    );

    if (!config.baseURL && providerSelector.value === 'gemini') {
      const baseURLInput = document.querySelector('#baseURL') as HTMLInputElement;
      baseURLInput.value = getProviderBaseURL('gemini') || '';
    }
  }

  syncBaseURLWithProvider();
  handleModeChange();
  checkCanIncludeImages();
  void populateDatalistWithGptVersions();

  // Auto-save on any input/change
  inputsText.forEach(id =>
    (document.querySelector('#' + id) as HTMLInputElement).addEventListener('input', () =>
      saveConfig({ silent: true })
    )
  );
  inputsCheckbox.forEach(id =>
    (document.querySelector('#' + id) as HTMLInputElement).addEventListener('change', () =>
      saveConfig({ silent: true })
    )
  );
  providerSelector.addEventListener('change', () => saveConfig({ silent: true }));
  modes.forEach(btn => btn.addEventListener('click', () => saveConfig({ silent: true })));
});
