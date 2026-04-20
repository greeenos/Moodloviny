/**
 * Normlize text
 * @param text
 */
function normalizeText(text: string, toLowerCase: boolean = true) {
  if (toLowerCase) text = text.toLowerCase();

  return text
    .replace(/(\n[ \t]*){2,}/g, '\n') // collapse blank/whitespace-only lines
    .replace(/[ \t]+/g, ' ') // collapse multiple spaces or tabs
    .trim()
    // We remove the following content because sometimes ChatGPT will reply: "answer d"
    .replace(/^[a-z\d]\.\s/gi, '') //a. text, b. text, c. text, 1. text, 2. text, 3.text
    .replace(/\n[a-z\d]\.\s/gi, '\n'); //same but with new line
}

export default normalizeText;
