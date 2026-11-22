// Proceso principal de Electron: abre la ventana de StudioFlow.
// En desarrollo carga el servidor de Vite; empaquetada, sirve el build desde app://studioflow,
// un origen fijo que el backend permite en CORS (file:// enviaría el origen "null").
const { app, BrowserWindow, net, protocol, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// `electron . --dev` usa el servidor de Vite (npm run dev) para tener recarga en caliente.
const DEV_URL = process.argv.includes('--dev') ? 'http://localhost:5173' : null;
const DIST = path.join(__dirname, '..', 'dist');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

function serveBuild() {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url);
    const file = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
    // Nunca servir nada fuera de dist/, y cualquier ruta desconocida devuelve la app.
    const safe = file.startsWith(DIST) && path.extname(file) ? file : path.join(DIST, 'index.html');
    return net.fetch(pathToFileURL(safe).toString());
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'StudioFlow',
    backgroundColor: '#0f1012',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });

  // Los enlaces externos se abren en el navegador, no dentro de la app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  window.loadURL(DEV_URL || 'app://studioflow/index.html');
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows();
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });

  app.whenReady().then(() => {
    if (!DEV_URL) serveBuild();
    createWindow();
    app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
