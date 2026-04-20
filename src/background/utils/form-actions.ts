type ValueInput = HTMLInputElement | HTMLTextAreaElement;

const DEFAULT_TYPING_INTERVAL_MS = 12;
const DEFAULT_HOVER_FALLBACK_MS = 1200;

function dispatchInputAndChangeEvents(element: HTMLElement) {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function setNativeValue(element: ValueInput | HTMLSelectElement, value: string) {
  const proto = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');

  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }

  dispatchInputAndChangeEvents(element);
}

function setNativeChecked(element: HTMLInputElement, checked: boolean) {
  const proto = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'checked');

  if (descriptor?.set) {
    descriptor.set.call(element, checked);
  } else {
    element.checked = checked;
  }

  dispatchInputAndChangeEvents(element);
}

export function fillInputValue(element: ValueInput, value: string) {
  setNativeValue(element, value);
}

export function fillSelectValue(element: HTMLSelectElement, value: string) {
  setNativeValue(element, value);
}

export function fillChecked(element: HTMLInputElement, checked: boolean) {
  setNativeChecked(element, checked);
}

export function applyWithOptionalHover({
  enableHover,
  hoverTarget,
  apply,
  fallbackDelayMs = DEFAULT_HOVER_FALLBACK_MS
}: {
  enableHover?: boolean;
  hoverTarget: HTMLElement;
  apply: () => void;
  fallbackDelayMs?: number;
}) {
  let applied = false;

  const applyOnce = () => {
    if (applied) return;
    applied = true;
    apply();
  };

  if (!enableHover) {
    applyOnce();
    return;
  }

  hoverTarget.addEventListener('mouseover', applyOnce, { once: true });
  setTimeout(applyOnce, fallbackDelayMs);
}

export function runTypingEffect({
  text,
  apply
}: {
  text: string;
  apply: (value: string) => void;
}) {
  const finalText = text ?? '';

  if (finalText.length === 0) {
    apply('');
    return;
  }

  let index = 0;
  const timerId = setInterval(() => {
    index += 1;
    apply(finalText.slice(0, index));

    if (index >= finalText.length) {
      clearInterval(timerId);
    }
  }, DEFAULT_TYPING_INTERVAL_MS);
}
