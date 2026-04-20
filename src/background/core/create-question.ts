import normalizeText from 'background/utils/normalize-text';
import htmlTableToString from 'background/utils/html-table-to-string';

function createDdwtosQuestion(formulation: HTMLElement): string {
  const qtext = formulation.querySelector('.qtext') as HTMLElement | null;
  if (!qtext) return normalizeText(formulation.innerText, false);

  const clone = qtext.cloneNode(true) as HTMLElement;

  clone.querySelectorAll('.accesshide').forEach(el => el.remove());

  const drops = clone.querySelectorAll('span.drop');
  drops.forEach((drop, i) => {
    drop.textContent = ` [BLANK ${i + 1}] `;
  });

  let questionText = (clone.textContent ?? '').replace(/\s+/g, ' ').trim();

  const dragItems = formulation.querySelectorAll('span.draghome, div.draghome');
  const seenChoices = new Set<string>();
  const choiceTexts: string[] = [];
  for (const item of dragItems) {
    const text = (item as HTMLElement).innerText.trim();
    if (text && !seenChoices.has(text)) {
      seenChoices.add(text);
      choiceTexts.push(text);
    }
  }

  if (choiceTexts.length > 0) {
    questionText += '\nAvailable words: ' + choiceTexts.join(', ');
    questionText += '\nFill in each blank with one of the available words. Write one answer per line in order.';
  }

  return normalizeText(questionText, false);
}

/**
 * Normalize the question as text and add sub informations
 * @param langage
 * @param question
 * @returns
 */
function createAndNormalizeQuestion(questionContainer: HTMLElement) {
  if (questionContainer.classList.contains('qtype_ddwtos')) {
    return createDdwtosQuestion(questionContainer);
  }

  let question = questionContainer.innerText;

  // We remove unnecessary information
  const accesshideElements: NodeListOf<HTMLElement> =
    questionContainer.querySelectorAll('.accesshide');
  for (const useless of accesshideElements) {
    question = question.replace(useless.innerText, '');
  }
  const attoText = questionContainer.querySelector('.qtype_essay_editor');
  if (attoText) {
    question = question.replace((attoText as HTMLElement).innerText, '');
  }
  const clearMyChoice = questionContainer.querySelector('[role="button"]');
  if (clearMyChoice) question = question.replace((clearMyChoice as HTMLElement).innerText, '');

  // Make tables more readable for chat-gpt
  const tables: NodeListOf<HTMLTableElement> = questionContainer.querySelectorAll('.qtext table');
  for (const table of tables) {
    question = question.replace(table.innerText, '\n' + htmlTableToString(table) + '\n');
  }

  return normalizeText(question, false);
}

export default createAndNormalizeQuestion;
