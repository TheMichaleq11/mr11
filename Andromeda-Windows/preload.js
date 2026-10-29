// Mały, bezpieczny most między stroną a oknem: strona może tylko podać swój motyw
// (kolor przycisków okna i odcień szkła) i poprosić o ponowne wczytanie po braku internetu.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('andromedaOkno', {
  windows: true,
  motyw: (m) => ipcRenderer.send('andromeda:motyw', String(m)),
  ponow: (url) => ipcRenderer.send('andromeda:ponow', String(url || '')),
});
