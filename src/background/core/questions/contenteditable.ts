import type Config from '../../types/config';
import type GPTAnswer from '../../types/gpt-answer';
import { runTypingEffect } from 'background/utils/form-actions';

function setContentEditableValue(element: HTMLElement, value: string) {
  element.textContent = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

function isContentEditable(element: HTMLElement) {
  const contenteditable = element.getAttribute('contenteditable');
  return typeof contenteditable === 'string' && contenteditable !== 'false';
}

function getContentEditableInput(inputList: NodeListOf<HTMLElement>): HTMLElement | null {
  const candidates = Array.from(inputList);

  for (const candidate of candidates) {
    if (isContentEditable(candidate)) return candidate;
  }

  return null;
}

/**
 * Hanlde contenteditable elements
 * @param config
 * @param inputList
 * @param gptAnswer
 * @returns
 */
function handleContentEditable(
  config: Config,
  inputList: NodeListOf<HTMLElement>,
  gptAnswer: GPTAnswer
): boolean {
  const input = getContentEditableInput(inputList);
  if (!input) return false;

  if (config.typing) {
    runTypingEffect({
      text: gptAnswer.response,
      apply: value => setContentEditableValue(input, value)
    });
  } else {
    setContentEditableValue(input, gptAnswer.response);
  }

  return true;
}

export default handleContentEditable;
