const CURRENT_VERSION = '1.1.5';
const versionDisplay = document.querySelector('#version')!;

function setVersion(version: string) {
  versionDisplay.textContent = 'v' + version;
}

setVersion(CURRENT_VERSION);
