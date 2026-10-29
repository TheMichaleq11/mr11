// Andromeda na Windowsa — okno, w którym działa Andromeda z Vercela.
// Treść zawsze jest aktualna (ładuje się z sieci), a aplikacja dodaje: przezroczyste okno (same panele na pulpicie)
// albo szkło, własne przyciski okna w panelu, pamięć rozmiaru okna, skróty i otwieranie obcych linków w przeglądarce.
//
// Tryby tła (Ctrl+Shift+B przełącza po kolei, aplikacja uruchamia się wtedy ponownie):
//   ostre    — okno w pełni przezroczyste: widać tylko panele, a w odstępach prawdziwy pulpit; klik w odstęp trafia w pulpit
//   akryl    — systemowe szkło Windows 11 (rozmyty pulpit z szarym odcieniem)
//   rozmycie — eksperymentalne rozmycie z prawie przezroczystym odcieniem
const { app, BrowserWindow, shell, ipcMain, nativeTheme, Menu, session, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const START = process.env.ANDROMEDA_URL || 'https://andromeda-usos.vercel.app/';
const APP_HOST = new URL(START).host;

// Akryl (backgroundMaterial) działa od Windows 11 22H2 (kompilacja 22621). Starszy Windows: zwykłe tło.
const kompilacja = Number(os.release().split('.')[2] || 0);
const SZKLO = process.platform === 'win32' && kompilacja >= 22621 && process.env.ANDROMEDA_BEZ_SZKLA !== '1';
const TRYBY = ['ostre', 'akryl', 'rozmycie'];
function trybStartowy(zapisany) {
  if (process.env.ANDROMEDA_BEZ_SZKLA === '1') return 'zwykle';
  const t = TRYBY.includes(zapisany) ? zapisany : 'ostre';
  return t !== 'ostre' && !SZKLO ? 'ostre' : t;
}
let TRYB = 'ostre'; // ustalany przy starcie z okno.json
/** Znacznik dla strony (CSS): ostre | szklo | zwykle */
const znacznik = () => (TRYB === 'ostre' ? 'ostre' : TRYB === 'zwykle' ? 'zwykle' : 'szklo');

// ---------- czyste rozmycie pulpitu (bez szarego odcienia akrylu) ----------
// Akryl Windowsa nakłada mocny szary odcień, przez który pulpitu prawie nie widać. Tryb „rozmycie” wyłącza
// systemowe tło i włącza rozmycie tego, co jest za oknem (SetWindowCompositionAttribute, ACCENT_ENABLE_BLURBEHIND).
// Ctrl+Shift+B przełącza: rozmycie ↔ akryl. Wybór zapamiętuje się w okno.json.
let natywne = null;
function winApi() {
  if (natywne !== null) return natywne;
  natywne = false;
  try {
    const koffi = require('koffi');
    const user32 = koffi.load('user32.dll');
    const dwmapi = koffi.load('dwmapi.dll');
    const ACCENT = koffi.struct('ACCENT_POLICY', { AccentState: 'int', AccentFlags: 'int', GradientColor: 'uint32_t', AnimationId: 'int' });
    const WCAD = koffi.struct('WINCOMPATTRDATA', { Attribute: 'int', Data: 'void *', SizeOfData: 'size_t' });
    natywne = {
      koffi,
      ACCENT,
      setWCA: user32.func('bool __stdcall SetWindowCompositionAttribute(intptr_t hwnd, WINCOMPATTRDATA *data)'),
      dwmSet: dwmapi.func('long __stdcall DwmSetWindowAttribute(intptr_t hwnd, uint32_t attr, int *value, uint32_t size)'),
    };
  } catch (err) {
    console.error('Brak rozmycia (koffi):', err);
  }
  return natywne;
}
function hwnd(win) {
  const b = win.getNativeWindowHandle();
  return Number(b.length >= 8 ? b.readBigUInt64LE(0) : BigInt(b.readUInt32LE(0)));
}
/** tryb: 'rozmycie' | 'akryl'. Zwraca true, gdy się udało. */
function ustawTlo(win, tryb) {
  if (!SZKLO) return false;
  if (tryb === 'akryl') {
    const api = winApi();
    if (api) {
      try {
        const acc = api.koffi.alloc(api.ACCENT, 1);
        api.koffi.encode(acc, api.ACCENT, { AccentState: 0, AccentFlags: 0, GradientColor: 0, AnimationId: 0 });
        api.setWCA(hwnd(win), { Attribute: 19, Data: acc, SizeOfData: api.koffi.sizeof(api.ACCENT) });
      } catch { /* nic */ }
    }
    win.setBackgroundMaterial('acrylic');
    return true;
  }
  const api = winApi();
  if (!api) return false;
  try {
    const h = hwnd(win);
    api.dwmSet(h, 38 /* DWMWA_SYSTEMBACKDROP_TYPE */, [0 /* auto */], 4);
    const acc = api.koffi.alloc(api.ACCENT, 1);
    api.koffi.encode(acc, api.ACCENT, { AccentState: 4 /* ACRYLICBLURBEHIND z własnym, prawie przezroczystym odcieniem */, AccentFlags: 2, GradientColor: 0x10101020, AnimationId: 0 });
    return api.setWCA(h, { Attribute: 19 /* WCA_ACCENT_POLICY */, Data: acc, SizeOfData: api.koffi.sizeof(api.ACCENT) });
  } catch (err) {
    console.error('Rozmycie nie zadziałało:', err);
    return false;
  }
}

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
function zapiszOkno(win, tryb = TRYB) {
  try {
    const stan = { ...win.getNormalBounds(), max: win.isMaximized(), tryb };
    fs.writeFileSync(plikOkna(), JSON.stringify(stan));
  } catch {
    /* nie szkodzi */
  }
}

// ---------- odcień szkła zależnie od motywu Andromedy ----------
// jasne motywy → jasny akryl, ciemne → ciemny (w trybie ostrym nie ma znaczenia)
const JASNE = new Set(['jasny', 'blekit']);
let motyw = 'ciemny';
function ustawMotyw(_win, m) {
  if (typeof m === 'string') motyw = m;
  nativeTheme.themeSource = TRYB === 'akryl' || TRYB === 'rozmycie' ? (JASNE.has(motyw) ? 'light' : 'dark') : 'system';
}

let okno = null;
let oknoLogowania = null;

function jestLogowaniem(url) {
  try {
    const u = new URL(url);
    return u.host === APP_HOST && u.pathname.startsWith('/api/auth/login');
  } catch {
    return false;
  }
}

/** Zwykłe okno z ramką Windowsa na czas logowania. Po powrocie do Andromedy zamyka się, a główne okno wczytuje stronę. */
function otworzLogowanie(rodzic, url) {
  if (oknoLogowania && !oknoLogowania.isDestroyed()) {
    oknoLogowania.focus();
    return;
  }
  const lw = new BrowserWindow({
    parent: rodzic,
    width: 1060,
    height: 760,
    minWidth: 480,
    minHeight: 560,
    title: 'Logowanie — USOS UJ',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: '#FFFFFF',
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  oknoLogowania = lw;
  lw.once('ready-to-show', () => lw.show());
  lw.on('closed', () => { oknoLogowania = null; });
  lw.setMenu(null);
  const lwc = lw.webContents;
  let gotowe = false;
  const sprawdz = (adres) => {
    if (gotowe) return;
    try {
      const u = new URL(adres);
      // powrót do Andromedy po zalogowaniu (callback przekierowuje na stronę główną)
      if (u.host === APP_HOST && !u.pathname.startsWith('/api/auth/')) {
        gotowe = true;
        rodzic.loadURL(adres);
        lw.close();
        rodzic.focus();
      }
    } catch { /* pomijamy */ }
  };
  lwc.on('did-navigate', (_e, adres) => sprawdz(adres));
  lwc.on('did-redirect-navigation', (_e, adres) => sprawdz(adres));
  lwc.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && (input.key === 'F5' || ((input.control || input.meta) && input.key.toLowerCase() === 'r'))) { lwc.reload(); e.preventDefault(); }
  });
  lwc.on('context-menu', (_e, p) => {
    const items = p.isEditable
      ? [{ role: 'cut', label: 'Wytnij' }, { role: 'copy', label: 'Kopiuj' }, { role: 'paste', label: 'Wklej' }]
      : p.selectionText ? [{ role: 'copy', label: 'Kopiuj' }] : [];
    if (items.length) Menu.buildFromTemplate(items).popup({ window: lw });
  });
  lw.loadURL(url);
}

/** Następny tryb tła; zmiana przezroczystości wymaga nowego okna, więc aplikacja uruchamia się ponownie. */
function przelaczTryb(win) {
  if (TRYB === 'zwykle') return;
  const dostepne = SZKLO ? TRYBY : ['ostre'];
  const nastepny = dostepne[(dostepne.indexOf(TRYB) + 1) % dostepne.length];
  if (nastepny === TRYB) return;
  zapiszOkno(win, nastepny);
  app.relaunch();
  app.exit(0);
}

// ---------- zmiana rozmiaru przezroczystego okna (własne uchwyty na brzegach) ----------
const MIN_W = 960;
const MIN_H = 620;
let rozmiar = null;
function rozmiarStart(win, krawedz) {
  if (win.isMaximized()) return;
  rozmiar = { krawedz: String(krawedz), b: win.getBounds(), p: screen.getCursorScreenPoint() };
}
function rozmiarRuch(win) {
  if (!rozmiar) return;
  const c = screen.getCursorScreenPoint();
  const dx = c.x - rozmiar.p.x;
  const dy = c.y - rozmiar.p.y;
  let { x, y, width, height } = rozmiar.b;
  const k = rozmiar.krawedz;
  if (k.includes('e')) width = Math.max(MIN_W, rozmiar.b.width + dx);
  if (k.includes('s')) height = Math.max(MIN_H, rozmiar.b.height + dy);
  if (k.includes('w')) { width = Math.max(MIN_W, rozmiar.b.width - dx); x = rozmiar.b.x + rozmiar.b.width - width; }
  if (k.includes('n')) { height = Math.max(MIN_H, rozmiar.b.height - dy); y = rozmiar.b.y + rozmiar.b.height - height; }
  win.setBounds({ x, y, width, height });
}

function utworzOkno() {
  const s = wczytajOkno();
  const ostre = TRYB === 'ostre';
  const szklo = TRYB === 'akryl' || TRYB === 'rozmycie';
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
    // ostre: okno bez ramki i w pełni przezroczyste; szkło/zwykłe: ukryty pasek tytułu (zostają systemowe krawędzie do zmiany rozmiaru)
    ...(ostre
      ? { frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false, thickFrame: false }
      : { titleBarStyle: 'hidden', backgroundColor: szklo ? '#00000000' : '#070B1F', ...(szklo ? { backgroundMaterial: 'acrylic' } : {}) }),
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
  win.once('ready-to-show', () => {
    if (TRYB === 'rozmycie' && !ustawTlo(win, 'rozmycie')) ustawTlo(win, 'akryl');
    win.show();
  });
  win.on('close', () => zapiszOkno(win));
  // stan okna dla własnych przycisków (ikona „przywróć” przy zmaksymalizowanym)
  const stan = () => { if (!win.isDestroyed()) win.webContents.send('andromeda:stan', { max: win.isMaximized() }); };
  win.on('maximize', stan);
  win.on('unmaximize', stan);
  win.webContents.on('did-finish-load', stan);

  const wc = win.webContents;

  // klik w link do innej strony → zwykła przeglądarka; Andromeda i logowanie UJ zostają w oknie
  wc.on('will-navigate', (e, url) => {
    if (url.startsWith('file:')) return;
    // logowanie USOS/UJ (z weryfikacją Microsoft) w osobnym, zwykłym okienku — bez szkła i bez ukrytego paska,
    // bo obce strony logowania źle znoszą akryl (zacinanie, niedziałające kliknięcia)
    if (jestLogowaniem(url)) {
      e.preventDefault();
      otworzLogowanie(win, url);
      return;
    }
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
    win.loadFile(path.join(__dirname, 'offline.html'), { query: { u: url || START, tryb: znacznik() } });
  });

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
    else if (ctrl && input.shift && k === 'b') { przelaczTryb(win); e.preventDefault(); }
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
    TRYB = trybStartowy(wczytajOkno().tryb);
    const ua = `${session.defaultSession.getUserAgent()} AndromedaOkno/${app.getVersion()} (${znacznik()})`;
    session.defaultSession.setUserAgent(ua);
    app.userAgentFallback = ua;
    session.defaultSession.setSpellCheckerLanguages(['pl', 'en-US']);

    ipcMain.on('andromeda:motyw', (e, m) => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (win && typeof m === 'string') ustawMotyw(win, m);
    });
    // własne przyciski okna w panelu
    ipcMain.on('andromeda:okno', (e, akcja) => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (!win) return;
      if (akcja === 'min') win.minimize();
      else if (akcja === 'max') (win.isMaximized() ? win.unmaximize() : win.maximize());
      else if (akcja === 'zamknij') win.close();
    });
    // tryb ostry: klik w przezroczysty odstęp przechodzi na pulpit
    ipcMain.on('andromeda:przez', (e, przez) => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (win && TRYB === 'ostre') win.setIgnoreMouseEvents(!!przez, { forward: true });
    });
    ipcMain.on('andromeda:rozmiar', (e, faza, krawedz) => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (!win) return;
      if (faza === 'start') rozmiarStart(win, krawedz);
      else if (faza === 'ruch') rozmiarRuch(win);
      else rozmiar = null;
    });
    ipcMain.on('andromeda:ponow', (e, url) => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (win) win.loadURL(wewnatrz(url) ? url : START);
    });

    utworzOkno();
  });

  app.on('window-all-closed', () => app.quit());
}
