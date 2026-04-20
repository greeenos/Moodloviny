import type Config from '../../types/config';
import type GPTAnswer from '../../types/gpt-answer';
import { fillInputValue, runTypingEffect } from 'background/utils/form-actions';

function getNumberInput(inputList: NodeListOf<HTMLElement>): HTMLInputElement | null {
  const candidates = Array.from(inputList);

  for (const candidate of candidates) {
    if (candidate instanceof HTMLInputElement && candidate.type === 'number') {
      return candidate;
    }
  }

  return null;
}

/**
 * Handle number input
 * @param config
 * @param inputList
 * @param gptAnswer
 * @returns
 */
function handleNumber(
  config: Config,
  inputList: NodeListOf<HTMLElement>,
  gptAnswer: GPTAnswer
): boolean {
  const input = getNumberInput(inputList);
  if (!input) return false;

  const number = gptAnswer.normalizedResponse.match(/\d+([,.]\d+)?/gi)?.[0]?.replace(',', '.');

  if (number === undefined) return false;

  if (config.typing) {
    runTypingEffect({
      text: number,
      apply: value => fillInputValue(input, value)
    });
  } else {
    fillInputValue(input, number);
  }

  return true;
}


export default handleNumber;
