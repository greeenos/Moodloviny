/**
 * Show message into the popup
 */
export function showMessage({
  msg,
  isError,
  isInfinite
}: {
  msg: string;
  isError?: boolean;
  isInfinite?: boolean;
}) {
  const message: HTMLElement = document.querySelector('#message')!;
  message.style.color = isError ? 'red' : 'limegreen';
  message.textContent = msg;
  message.style.display = 'block';
  if (!isInfinite) setTimeout(() => (message.style.display = 'none'), 5000);
}
