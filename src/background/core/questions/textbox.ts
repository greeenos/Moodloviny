import type Config from '../../types/config';
import type GPTAnswer from '../../types/gpt-answer';
import { fillInputValue, runTypingEffect } from 'background/utils/form-actions';

function getTextboxInput(inputList: NodeListOf<HTMLElement>): HTMLInputElement | HTMLTextAreaElement | null {
  const candidates = Array.from(inputList);

  for (const candidate of candidates) {
    if (candidate instanceof HTMLTextAreaElement) return candidate;

    if (candidate instanceof HTMLInputElement && candidate.type === 'text') {
      return candidate;
    }
  }

  return null;
}

function getTextboxAnswer(input: HTMLInputElement | HTMLTextAreaElement, response: string): string {
  if (input.tagName === 'TEXTAREA') return response;

  const firstLine = response
    .split('\n')
    .map(line => line.trim())
    .find(Boolean);

  return firstLine || response;
}

/**
 * Handle textbox
 * @param config
 * @param inputList
 * @param gptAnswer
 * @returns
 */
function handleTextbox(
  config: Config,
  inputList: NodeListOf<HTMLElement>,
  gptAnswer: GPTAnswer
): boolean {
  const input = getTextboxInput(inputList);
  if (!input) return false;

  const answer = getTextboxAnswer(input, gptAnswer.response);

  if (config.typing) {
    runTypingEffect({
      text: answer,
      apply: value => fillInputValue(input, value)
    });
  } else {
    fillInputValue(input, answer);
  }

  return true;
}

export default handleTextbox;
