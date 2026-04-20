import type Config from './types/config';
import { codeListener, setUpMoodloviny } from './core/code-listener';

chrome.storage.sync.get(['moodloviny']).then(function (storage) {
  const config: Config = storage.moodloviny;

  if (!config) throw new Error('Please configure Moodloviny in the extension settings');

  if (config.code) {
    codeListener(config);
  } else {
    setUpMoodloviny(config);
  }
});
