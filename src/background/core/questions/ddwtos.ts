import type Config from '../../types/config';
import type GPTAnswer from '../../types/gpt-answer';
import normalizeText from 'background/utils/normalize-text';
import { pickBestReponse } from 'background/utils/pick-best-response';
import { fillInputValue } from 'background/utils/form-actions';
import Logs from 'background/utils/logs';

/**
 * Handle drag-and-drop into text (ddwtos) questions.
 * Finds hidden inputs by drop zone place number and fills them with the matching choice index.
 */
function handleDdwtos(config: Config, questionElement: HTMLElement, gptAnswer: GPTAnswer): boolean {
  const form = questionElement.closest('.formulation') as HTMLElement | null;
  if (!form || !form.classList.contains('qtype_ddwtos')) return false;

  const dropZones = form.querySelectorAll('.qtext span.drop');
  if (dropZones.length === 0) return false;

  // Collect unique drag choices (each word may appear multiple times as copies)
  const seen = new Set<string>();
  const choices: { element: HTMLElement; value: string; choiceNum: string }[] = [];
  for (const item of form.querySelectorAll('span.draghome, div.draghome')) {
    const el = item as HTMLElement;
    const choiceNum = el.dataset.choice ?? '';
    if (!choiceNum || seen.has(choiceNum)) continue;
    seen.add(choiceNum);
    choices.push({ element: el, value: normalizeText(el.innerText.trim()), choiceNum });
  }

  if (choices.length === 0) return false;

  const answers = gptAnswer.normalizedResponse.split('\n').filter(a => a.trim());

  if (config.logs) Logs.array(answers);

  for (let i = 0; i < dropZones.length; i++) {
    if (!answers[i]) break;

    const dropZone = dropZones[i] as HTMLElement;
    const placeNum = dropZone.dataset.place ?? String(i + 1);

    const hiddenInput = form.querySelector(
      `input[type="hidden"][name$="_p${placeNum}"]`
    ) as HTMLInputElement | null;
    if (!hiddenInput) continue;

    const best = pickBestReponse(
      normalizeText(answers[i]),
      choices.map(c => ({ element: c.element, value: c.value }))
    );

    if (!best.element) continue;

    const matched = choices.find(c => c.element === best.element);
    if (!matched) continue;

    if (config.logs) Logs.bestAnswer(best.value!, best.similarity);

    fillInputValue(hiddenInput, matched.choiceNum);
  }

  return true;
}

export default handleDdwtos;
