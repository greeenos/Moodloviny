import type Config from '../../types/config';
import type GPTAnswer from '../../types/gpt-answer';
import { runTypingEffect } from 'background/utils/form-actions';

function getAttoInput(inputList: NodeListOf<HTMLElement>): HTMLElement | null {
  const candidates = Array.from(inputList);

  for (const candidate of candidates) {
    if (candidate.classList.contains('qtype_essay_editor')) return candidate;
  }

  return null;
}

function setAttoValue(iframeBody: HTMLBodyElement, value: string) {
  const textContainer = iframeBody.querySelector('p');
  if (!textContainer) return;

  textContainer.textContent = value;
  iframeBody.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Hanlde atto editor
 * See: https://docs.moodle.org/404/en/Atto_editor#Atto_accessibility
 * @param config
 * @param inputList
 * @param gptAnswer
 * @returns
 */
function handleAtto(
  config: Config,
  inputList: NodeListOf<HTMLElement>,
  gptAnswer: GPTAnswer
): boolean {
  const input = getAttoInput(inputList);
  if (!input) return false;

  const iframe = input.querySelector('iframe');
  if (!iframe || !iframe.contentDocument || !iframe.contentDocument.body || !iframe.contentWindow) {
    return false;
  }
  const iframeBody = iframe.contentDocument.body;

  const textContainer = iframeBody.querySelector('p');
  if (!textContainer) return false;

  if (config.typing) {
    runTypingEffect({
      text: gptAnswer.response,
      apply: value => setAttoValue(iframeBody, value)
    });
  } else {
    setAttoValue(iframeBody, gptAnswer.response);
  }

  return true;
}

export default handleAtto;
