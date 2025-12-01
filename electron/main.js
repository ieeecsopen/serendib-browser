const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');

// Check if running in development mode
const isDev = !app.isPackaged;

let mainWindow;

// Use a realistic user agent
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ============================================================================
// Container Session Management
// ============================================================================

// Track all container sessions and their metadata
const containerSessions = new Map();
const disposableContainers = new Set();

/**
 * Get or create a session partition for a container
 * @param {string} containerId - The container ID
 * @param {boolean} isDisposable - Whether this is a disposable container
 * @returns {string} The partition string for the session
 */
function getContainerPartition(containerId, isDisposable = false) {
    // Disposable containers use non-persistent partitions (no 'persist:' prefix)
    // This means their data is stored in memory only and cleared when the session ends
    if (isDisposable) {
        disposableContainers.add(containerId);
        return `container-disposable-${containerId}`;
    }
    
    // Regular containers persist across sessions
    return `persist:container-${containerId}`;
}

/**
 * Configure a session with proper security settings and user agent
 * @param {Electron.Session} ses - The session to configure
 */
function configureSession(ses) {
    // Set realistic user agent to avoid bot detection
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = userAgent;
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });
    
    // Block known tracking domains (basic ad blocking)
    ses.webRequest.onBeforeRequest({ urls: ['*://*.doubleclick.net/*', '*://*.googlesyndication.com/*'] }, (details, callback) => {
        callback({ cancel: true });
    });
}

/**
 * Clear all data for a container session
 * @param {string} containerId - The container ID to clear
 */
async function clearContainerData(containerId) {
    const isDisposable = disposableContainers.has(containerId);
    const partition = isDisposable 
        ? `container-disposable-${containerId}`
        : `persist:container-${containerId}`;
    
    try {
        const ses = session.fromPartition(partition);
        await ses.clearStorageData({
            storages: ['cookies', 'localstorage', 'sessionstorage', 'indexdb', 'websql', 'serviceworkers', 'cachestorage']
        });
        await ses.clearCache();
        await ses.clearAuthCache();
        
        containerSessions.delete(containerId);
        disposableContainers.delete(containerId);
        
        console.log(`[Container] Cleared session data for: ${containerId}`);
        return { success: true };
    } catch (error) {
        console.error(`[Container] Error clearing session for ${containerId}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Get session statistics for a container
 * @param {string} containerId - The container ID
 */
async function getContainerStats(containerId) {
    const isDisposable = disposableContainers.has(containerId);
    const partition = isDisposable 
        ? `container-disposable-${containerId}`
        : `persist:container-${containerId}`;
    
    try {
        const ses = session.fromPartition(partition);
        const cookies = await ses.cookies.get({});
        const cacheSize = await ses.getCacheSize();
        
        return {
            containerId,
            isDisposable,
            cookieCount: cookies.length,
            cacheSize,
            cacheSizeFormatted: formatBytes(cacheSize)
        };
    } catch (error) {
        console.error(`[Container] Error getting stats for ${containerId}:`, error);
        return null;
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

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

    // Set user agent for the default session to avoid bot detection
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = userAgent;
        callback({ cancel: false, requestHeaders: details.requestHeaders });
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

// ============================================================================
// Container IPC Handlers
// ============================================================================

// Get partition string for a container
ipcMain.handle('container-get-partition', (event, containerId, isDisposable) => {
    const partition = getContainerPartition(containerId, isDisposable);
    
    // Configure the session if it's new
    const ses = session.fromPartition(partition);
    configureSession(ses);
    
    containerSessions.set(containerId, { partition, isDisposable });
    console.log(`[Container] Created/retrieved partition for: ${containerId} (disposable: ${isDisposable})`);
    
    return partition;
});

// Clear a container's session data
ipcMain.handle('container-clear', async (event, containerId) => {
    return await clearContainerData(containerId);
});

// Destroy a disposable container completely
ipcMain.handle('container-destroy', async (event, containerId) => {
    const result = await clearContainerData(containerId);
    if (result.success) {
        console.log(`[Container] Destroyed disposable container: ${containerId}`);
    }
    return result;
});

// Get container statistics
ipcMain.handle('container-get-stats', async (event, containerId) => {
    return await getContainerStats(containerId);
});

// List all active containers
ipcMain.handle('container-list-active', () => {
    const active = [];
    for (const [id, data] of containerSessions) {
        active.push({
            id,
            partition: data.partition,
            isDisposable: data.isDisposable || disposableContainers.has(id)
        });
    }
    return active;
});

// Clear all disposable containers (called on app quit or manual cleanup)
ipcMain.handle('container-clear-all-disposable', async () => {
    const results = [];
    for (const containerId of disposableContainers) {
        const result = await clearContainerData(containerId);
        results.push({ containerId, ...result });
    }
    return results;
});

// Get cookies for a container
ipcMain.handle('container-get-cookies', async (event, containerId, filter = {}) => {
    const isDisposable = disposableContainers.has(containerId);
    const partition = isDisposable 
        ? `container-disposable-${containerId}`
        : `persist:container-${containerId}`;
    
    try {
        const ses = session.fromPartition(partition);
        const cookies = await ses.cookies.get(filter);
        return { success: true, cookies };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Remove a specific cookie from a container
ipcMain.handle('container-remove-cookie', async (event, containerId, url, name) => {
    const isDisposable = disposableContainers.has(containerId);
    const partition = isDisposable 
        ? `container-disposable-${containerId}`
        : `persist:container-${containerId}`;
    
    try {
        const ses = session.fromPartition(partition);
        await ses.cookies.remove(url, name);
        return { success: true };
    } catch (error) {
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
    // Clear all disposable containers before quitting
    for (const containerId of disposableContainers) {
        clearContainerData(containerId).catch(console.error);
    }
    
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
