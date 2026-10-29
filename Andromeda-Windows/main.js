// Andromeda na Windowsa — okno z prawdziwym szkłem (akryl Windows 11), w którym działa Andromeda z Vercela.
// Treść zawsze jest aktualna (ładuje się z sieci), a aplikacja dodaje: szkło, natywne przyciski okna,
// pamięć rozmiaru okna, skróty klawiszowe i otwieranie obcych linków w przeglądarce.
const { app, BrowserWindow, shell, ipcMain, nativeTheme, Menu, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const START = process.env.ANDROMEDA_URL || 'https://andromeda-usos.vercel.app/';
const APP_HOST = new URL(START).host;
const PASEK = 42; // wysokość paska z przyciskami okna (taka sama jak --okno-pasek w CSS)

// Akryl (backgroundMaterial) działa od Windows 11 22H2 (kompilacja 22621). Starszy Windows: zwykłe tło.
const kompilacja = Number(os.release().split('.')[2] || 0);
const SZKLO = process.platform === 'win32' && kompilacja >= 22621 && process.env.ANDROMEDA_BEZ_SZKLA !== '1';

/** Strony, które mają się otwierać w oknie aplikacji: sama Andromeda i logowanie UJ/USOS. */
function wewnatrz(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const h = u.hostname;
    return u.host === APP_HOST || h === 'uj.edu.pl' || h.endsWith('.uj.edu.pl') || h === 'localhost';
  } catch {
    return false;
  }
}

function naZewnatrz(url) {
  try {
    const p = new URL(url).protocol;
    if (['https:', 'http:', 'mailto:', 'webcal:', 'tel:'].includes(p)) shell.openExternal(url);
  } catch {
    /* zły adres — nic nie robimy */
  }
}

// ---------- pamięć położenia i rozmiaru okna ----------
const plikOkna = () => path.join(app.getPath('userData'), 'okno.json');
function wczytajOkno() {
  try {
    return JSON.parse(fs.readFileSync(plikOkna(), 'utf8'));
  } catch {
    return {};
  }
}
function zapiszOkno(win) {
  try {
    const stan = { ...win.getNormalBounds(), max: win.isMaximized() };
    fs.writeFileSync(plikOkna(), JSON.stringify(stan));
  } catch {
    /* nie szkodzi */
  }
}

// ---------- kolory przycisków okna zależnie od motywu Andromedy ----------
// jasne motywy → jasny akryl i ciemne symbole; ciemne → ciemny akryl i białe symbole
const MOTYWY = {
  ciemny: { jasny: false },
  noc: { jasny: false },
  jasny: { jasny: true },
  blekit: { jasny: true },
};
let motyw = 'ciemny';
function ustawMotyw(win, m, naLogowaniu = false) {
  if (MOTYWY[m]) motyw = m;
  // bez szkła Błękit ma pod spodem pełny niebieski — wtedy białe symbole
  const jasnyPasek = !naLogowaniu && MOTYWY[motyw].jasny && (SZKLO || motyw === 'jasny');
  nativeTheme.themeSource = SZKLO ? (MOTYWY[motyw].jasny && !naLogowaniu ? 'light' : 'dark') : 'system';
  try {
    win.setTitleBarOverlay({ color: '#00000000', symbolColor: jasnyPasek ? '#161C38' : '#FFFFFF', height: PASEK });
  } catch {
    /* system bez nakładki przycisków */
  }
}

let okno = null;

function utworzOkno() {
  const s = wczytajOkno();
  const win = new BrowserWindow({
    width: s.width || 1320,
    height: s.height || 860,
    x: s.x,
    y: s.y,
    minWidth: 960,
    minHeight: 620,
    show: false,
    title: 'Andromeda',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: SZKLO ? '#00000000' : '#070B1F',
    ...(SZKLO ? { backgroundMaterial: 'acrylic' } : {}),
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#00000000', symbolColor: '#FFFFFF', height: PASEK },
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });
  okno = win;
  if (s.max) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.on('close', () => zapiszOkno(win));

  const wc = win.webContents;

  // klik w link do innej strony → zwykła przeglądarka; Andromeda i logowanie UJ zostają w oknie
  wc.on('will-navigate', (e, url) => {
    if (url.startsWith('file:')) return;
    // w trakcie logowania (strony USOS/UJ) nie przeszkadzamy — logowanie może przejść przez inne serwery
    let zAplikacji = true;
    try { zAplikacji = new URL(wc.getURL()).host === APP_HOST; } catch { /* pusta strona */ }
    if (!zAplikacji) return;
    if (!wewnatrz(url)) {
      e.preventDefault();
      naZewnatrz(url);
    }
  });
  wc.setWindowOpenHandler(({ url }) => {
    if (wewnatrz(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: { autoHideMenuBar: true, icon: path.join(__dirname, 'build', 'icon.ico'), backgroundColor: '#FFFFFF' },
      };
    }
    naZewnatrz(url);
    return { action: 'deny' };
  });

  // brak internetu przy starcie → ekran „Brak połączenia” z przyciskiem „Spróbuj ponownie”
  wc.on('did-fail-load', (_e, kod, _opis, url, glowna) => {
    if (!glowna || kod === -3 /* przerwane — np. przekierowanie */) return;
    win.loadFile(path.join(__dirname, 'offline.html'), { query: { u: url || START, szklo: SZKLO ? '1' : '0' } });
  });

  // na ekranie logowania niebieskie tło → białe przyciski okna
  wc.on('did-navigate', (_e, url) => {
    const login = /\/zaloguj(\b|\/|\?|$)/.test(url) || !url.startsWith('https://' + APP_HOST);
    ustawMotyw(win, motyw, login);
  });
  wc.on('did-navigate-in-page', (_e, url) => ustawMotyw(win, motyw, /\/zaloguj/.test(url)));

  // skróty: odświeżanie, powiększenie, wstecz/dalej
  wc.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    const ctrl = input.control || input.meta;
    const k = input.key.toLowerCase();
    if (k === 'f5' || (ctrl && k === 'r')) { wc.reload(); e.preventDefault(); }
    else if (ctrl && (k === '=' || k === '+')) { wc.setZoomLevel(Math.min(wc.getZoomLevel() + 0.5, 4)); e.preventDefault(); }
    else if (ctrl && k === '-') { wc.setZoomLevel(Math.max(wc.getZoomLevel() - 0.5, -3)); e.preventDefault(); }
    else if (ctrl && k === '0') { wc.setZoomLevel(0); e.preventDefault(); }
    else if (input.alt && k === 'arrowleft') { if (wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack(); e.preventDefault(); }
    else if (input.alt && k === 'arrowright') { if (wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward(); e.preventDefault(); }
    else if (k === 'f12' && input.shift) { wc.toggleDevTools(); e.preventDefault(); }
  });
  // boczne przyciski myszy (wstecz / dalej)
  win.on('app-command', (_e, cmd) => {
    if (cmd === 'browser-backward' && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
    if (cmd === 'browser-forward' && wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward();
  });

  // menu pod prawym przyciskiem: kopiuj / wklej / otwórz link
  wc.on('context-menu', (_e, p) => {
    const items = [];
    if (p.linkURL) {
      items.push({ label: 'Otwórz w przeglądarce', click: () => naZewnatrz(p.linkURL) });
      items.push({ label: 'Kopiuj adres linku', click: () => require('electron').clipboard.writeText(p.linkURL) });
    }
    if (p.isEditable) {
      if (p.misspelledWord && p.dictionarySuggestions.length) {
        for (const s of p.dictionarySuggestions.slice(0, 4)) items.push({ label: s, click: () => wc.replaceMisspelling(s) });
        items.push({ type: 'separator' });
      }
      items.push({ role: 'cut', label: 'Wytnij' }, { role: 'copy', label: 'Kopiuj' }, { role: 'paste', label: 'Wklej' }, { role: 'selectAll', label: 'Zaznacz wszystko' });
    } else if (p.selectionText) {
      items.push({ role: 'copy', label: 'Kopiuj' });
    }
    if (items.length) Menu.buildFromTemplate(items).popup({ window: win });
  });

  win.loadURL(START);
  return win;
}

// jedna kopia aplikacji naraz — drugie uruchomienie pokazuje istniejące okno
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!okno) return;
    if (okno.isMinimized()) okno.restore();
    okno.focus();
  });

  app.setAppUserModelId('pl.andromeda.app');
  Menu.setApplicationMenu(null);

  app.whenReady().then(() => {
    // znacznik w user-agencie — strona po nim wie, że jest w oknie Windows (i czy ma szkło)
    const ua = `${session.defaultSession.getUserAgent()} AndromedaOkno/${app.getVersion()} (${SZKLO ? 'szklo' : 'zwykle'})`;
    session.defaultSession.setUserAgent(ua);
    app.userAgentFallback = ua;
    session.defaultSession.setSpellCheckerLanguages(['pl', 'en-US']);

    ipcMain.on('andromeda:motyw', (e, m) => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (win && typeof m === 'string') ustawMotyw(win, m);
    });
    ipcMain.on('andromeda:ponow', (e, url) => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (win) win.loadURL(wewnatrz(url) ? url : START);
    });

    utworzOkno();
  });

  app.on('window-all-closed', () => app.quit());
}
