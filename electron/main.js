const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');

// Check if running in development mode
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        frame: false, // Frameless window for custom UI
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true, // Enable webview tag for browser functionality
            sandbox: false,
            webSecurity: true,
        },
        backgroundColor: '#000000',
        titleBarStyle: 'hiddenInset', // For macOS traffic lights
        show: false, // Don't show until ready
    });

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://') || url.startsWith('http://')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // Configure webview permissions
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: http:"]
            }
        });
    });
}

// Window control handlers
ipcMain.handle('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.handle('window-close', () => {
    if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
});

// Browser navigation handlers
ipcMain.handle('navigate-to', (event, url) => {
    // This could be used for additional navigation logic
    return { success: true, url };
});

ipcMain.handle('get-page-info', async (event, webContentsId) => {
    try {
        const contents = require('electron').webContents.fromId(webContentsId);
        if (contents) {
            return {
                title: contents.getTitle(),
                url: contents.getURL(),
                canGoBack: contents.canGoBack(),
                canGoForward: contents.canGoForward(),
            };
        }
    } catch (error) {
        console.error('Error getting page info:', error);
    }
    return null;
});

// Download handler
ipcMain.handle('download-url', async (event, url) => {
    if (mainWindow) {
        mainWindow.webContents.downloadURL(url);
    }
});

// Session/Cookie management for containers
const containerSessions = new Map();

ipcMain.handle('get-container-session', (event, containerId) => {
    if (!containerSessions.has(containerId)) {
        const partition = `persist:container-${containerId}`;
        containerSessions.set(containerId, partition);
    }
    return containerSessions.get(containerId);
});

ipcMain.handle('clear-container-session', async (event, containerId) => {
    const partition = `persist:container-${containerId}`;
    try {
        const ses = session.fromPartition(partition);
        await ses.clearStorageData();
        await ses.clearCache();
        containerSessions.delete(containerId);
        return { success: true };
    } catch (error) {
        console.error('Error clearing container session:', error);
        return { success: false, error: error.message };
    }
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    // Handle webview creation
    contents.on('will-attach-webview', (event, webPreferences, params) => {
        // Strip away preload scripts if unused or verify their location is legitimate
        delete webPreferences.preload;
        
        // Disable Node.js integration
        webPreferences.nodeIntegration = false;
        webPreferences.contextIsolation = true;
        
        // Enable web security
        webPreferences.webSecurity = true;
    });

    contents.on('will-navigate', (event, navigationUrl) => {
        // Allow navigation within the app
    });

    // Handle new window requests from webviews
    contents.setWindowOpenHandler(({ url }) => {
        // Instead of opening a new window, we'll handle this in the renderer
        if (mainWindow) {
            mainWindow.webContents.send('new-tab-request', url);
        }
        return { action: 'deny' };
    });
});
