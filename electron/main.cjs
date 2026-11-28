const { app, BrowserWindow, Menu, shell } = require('electron');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.glb': 'model/gltf-binary',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

let gameServer = null;
let mainWindow = null;

function createGameServer(rootDirectory) {
  const root = path.resolve(rootDirectory);

  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end();
        return;
      }

      let pathname;
      try {
        pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
      } catch {
        response.writeHead(400);
        response.end('Bad request');
        return;
      }

      const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const filePath = path.resolve(root, relativePath);
      const insideRoot = filePath === root || filePath.startsWith(`${root}${path.sep}`);

      if (!insideRoot) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }

      fs.stat(filePath, (statError, stat) => {
        if (statError || !stat.isFile()) {
          response.writeHead(404);
          response.end('Not found');
          return;
        }

        const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
        response.writeHead(200, {
          'Cache-Control': 'no-cache',
          'Content-Length': stat.size,
          'Content-Type': contentType,
        });

        if (request.method === 'HEAD') {
          response.end();
          return;
        }

        const stream = fs.createReadStream(filePath);
        stream.on('error', () => {
          if (!response.headersSent) response.writeHead(500);
          response.end();
        });
        stream.pipe(response);
      });
    });

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      gameServer = server;
      resolve(server.address().port);
    });
  });
}

function installWindowShortcuts(window) {
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    if (input.key === 'F11') {
      event.preventDefault();
      window.setFullScreen(!window.isFullScreen());
      return;
    }

    if (input.key === 'Escape' && window.isFullScreen()) {
      event.preventDefault();
      window.setFullScreen(false);
      return;
    }

    if (!app.isPackaged && input.key === 'F12') {
      event.preventDefault();
      window.webContents.toggleDevTools();
    }
  });
}

async function createMainWindow(gameUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    useContentSize: true,
    show: false,
    backgroundColor: '#050507',
    autoHideMenuBar: true,
    title: '忘川录',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  installWindowShortcuts(mainWindow);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== gameUrl) event.preventDefault();
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(gameUrl);
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    app.setAppUserModelId('com.golannun.wangchuanchronicles');
    Menu.setApplicationMenu(null);

    const distDirectory = path.join(app.getAppPath(), 'dist');
    if (!fs.existsSync(path.join(distDirectory, 'index.html'))) {
      throw new Error(`Game build not found: ${distDirectory}`);
    }

    const port = await createGameServer(distDirectory);
    await createMainWindow(`http://127.0.0.1:${port}/`);
  }).catch((error) => {
    console.error(error);
    app.quit();
  });

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('will-quit', () => {
    gameServer?.close();
    gameServer = null;
  });
}
