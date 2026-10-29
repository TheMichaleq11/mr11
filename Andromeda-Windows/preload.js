// Mały, bezpieczny most między stroną a oknem: motyw, własne przyciski okna, zmiana rozmiaru,
// ponowne wczytanie po braku internetu. W trybie ostrym pilnuje też, by klik w przezroczysty odstęp
// trafiał w pulpit, a nie w okno.
const { contextBridge, ipcRenderer } = require('electron');

const tryb = (navigator.userAgent.match(/AndromedaOkno\/[\d.]+ \((ostre|szklo|zwykle)\)/) || [])[1] || 'zwykle';

contextBridge.exposeInMainWorld('andromedaOkno', {
  windows: true,
  tryb,
  motyw: (m) => ipcRenderer.send('andromeda:motyw', String(m)),
  ponow: (url) => ipcRenderer.send('andromeda:ponow', String(url || '')),
  min: () => ipcRenderer.send('andromeda:okno', 'min'),
  max: () => ipcRenderer.send('andromeda:okno', 'max'),
  zamknij: () => ipcRenderer.send('andromeda:okno', 'zamknij'),
  onStan: (cb) => {
    if (typeof cb !== 'function') return;
    ipcRenderer.on('andromeda:stan', (_e, s) => cb({ max: !!(s && s.max) }));
  },
  rozmiar: (faza, krawedz) => ipcRenderer.send('andromeda:rozmiar', String(faza), String(krawedz || '')),
});

if (tryb === 'ostre') {
  // przezroczyste miejsca: tło strony i odstępy między panelami
  let przez = null;
  const ustaw = (v) => {
    if (v === przez) return;
    przez = v;
    ipcRenderer.send('andromeda:przez', v);
  };
  const sprawdz = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const odstep = !el || el === document.documentElement || el === document.body || (el.classList && el.classList.contains('shell'));
    ustaw(odstep);
  };
  window.addEventListener('mousemove', (e) => { if (!e.buttons) sprawdz(e.clientX, e.clientY); }, true);
  window.addEventListener('mouseleave', () => ustaw(true));
}
