const { app, BrowserWindow, ipcMain, shell, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

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

// Full screen handlers
ipcMain.handle('window-toggle-fullscreen', () => {
    if (mainWindow) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
        return mainWindow.isFullScreen();
    }
    return false;
});

ipcMain.handle('window-is-fullscreen', () => {
    return mainWindow ? mainWindow.isFullScreen() : false;
});

ipcMain.handle('window-exit-fullscreen', () => {
    if (mainWindow && mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
    }
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
// Print & PDF Handlers
// ============================================================================

// Print the current page
ipcMain.handle('print-page', async (event, options = {}) => {
    try {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.print({
                silent: options.silent || false,
                printBackground: options.printBackground !== false,
                color: options.color !== false,
                margins: options.margins || { marginType: 'default' },
                landscape: options.landscape || false,
                scaleFactor: options.scaleFactor || 100,
                pagesPerSheet: options.pagesPerSheet || 1,
                collate: options.collate !== false,
                copies: options.copies || 1,
                pageRanges: options.pageRanges || {},
            }, (success, failureReason) => {
                if (!success) {
                    console.error('[Print] Failed:', failureReason);
                }
            });
            return { success: true };
        }
        return { success: false, error: 'No focused window' };
    } catch (error) {
        console.error('[Print] Error:', error);
        return { success: false, error: error.message };
    }
});

// Save page as PDF
ipcMain.handle('save-pdf', async (event, options = {}) => {
    try {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (!focusedWindow) {
            return { success: false, error: 'No focused window' };
        }

        // Show save dialog
        const { filePath, canceled } = await dialog.showSaveDialog(focusedWindow, {
            title: 'Save as PDF',
            defaultPath: options.fileName || 'page.pdf',
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        });

        if (canceled || !filePath) {
            return { success: false, canceled: true };
        }

        // Generate PDF
        const pdfData = await focusedWindow.webContents.printToPDF({
            marginsType: options.marginsType || 0, // 0: default, 1: none, 2: minimum
            pageSize: options.pageSize || 'A4',
            printBackground: options.printBackground !== false,
            printSelectionOnly: options.printSelectionOnly || false,
            landscape: options.landscape || false,
            scaleFactor: options.scaleFactor || 100,
            generateTaggedPDF: options.generateTaggedPDF || false,
        });

        // Save to file
        await fs.writeFile(filePath, pdfData);
        
        // Open the file location
        if (options.openFile) {
            shell.openPath(filePath);
        } else if (options.showInFolder) {
            shell.showItemInFolder(filePath);
        }

        console.log('[PDF] Saved to:', filePath);
        return { success: true, filePath };
    } catch (error) {
        console.error('[PDF] Error:', error);
        return { success: false, error: error.message };
    }
});

// ============================================================================
// Developer Tools Handlers
// ============================================================================

// Open DevTools for the webview's web contents
ipcMain.handle('devtools-open', async (event, options = {}) => {
    try {
        // The webview's guest contents need to be accessed through the webview itself
        // We'll send a message back to the renderer to handle this
        return { success: true, message: 'DevTools command received' };
    } catch (error) {
        console.error('[DevTools] Error:', error);
        return { success: false, error: error.message };
    }
});

// Toggle DevTools for the main window (useful for debugging the browser itself)
ipcMain.handle('devtools-toggle-main', async () => {
    try {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools();
            return { success: true };
        }
        return { success: false, error: 'No focused window' };
    } catch (error) {
        console.error('[DevTools] Error:', error);
        return { success: false, error: error.message };
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

// ============================================================================
// Snapshot File Operations
// ============================================================================

const SNAPSHOT_EXTENSION = '.Seran-snapshot';

// Get the snapshots directory path
function getSnapshotsDir() {
    return path.join(app.getPath('userData'), 'snapshots');
}

// Ensure snapshots directory exists
async function ensureSnapshotsDir() {
    const dir = getSnapshotsDir();
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
    return dir;
}

// Save snapshot to file
ipcMain.handle('snapshot-save-to-file', async (event, filename, content) => {
    try {
        const dir = await ensureSnapshotsDir();
        const safeName = filename.replace(/[^a-z0-9\-_]/gi, '-');
        const filePath = path.join(dir, `${safeName}${SNAPSHOT_EXTENSION}`);
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`[Snapshot] Saved to: ${filePath}`);
        return { success: true, filePath };
    } catch (error) {
        console.error('[Snapshot] Save error:', error);
        return { success: false, error: error.message };
    }
});

// Load snapshot from file
ipcMain.handle('snapshot-load-from-file', async (event, filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return { success: true, content };
    } catch (error) {
        console.error('[Snapshot] Load error:', error);
        return { success: false, error: error.message };
    }
});

// List all saved snapshots
ipcMain.handle('snapshot-list-files', async () => {
    try {
        const dir = await ensureSnapshotsDir();
        const files = await fs.readdir(dir);
        const snapshots = [];
        
        for (const file of files) {
            if (file.endsWith(SNAPSHOT_EXTENSION)) {
                const filePath = path.join(dir, file);
                const stats = await fs.stat(filePath);
                snapshots.push({
                    filename: file,
                    filePath,
                    size: stats.size,
                    createdAt: stats.birthtime.getTime(),
                    modifiedAt: stats.mtime.getTime()
                });
            }
        }
        
        return { success: true, snapshots };
    } catch (error) {
        console.error('[Snapshot] List error:', error);
        return { success: false, error: error.message, snapshots: [] };
    }
});

// Delete snapshot file
ipcMain.handle('snapshot-delete-file', async (event, filePath) => {
    try {
        await fs.unlink(filePath);
        console.log(`[Snapshot] Deleted: ${filePath}`);
        return { success: true };
    } catch (error) {
        console.error('[Snapshot] Delete error:', error);
        return { success: false, error: error.message };
    }
});

// Export snapshot with file dialog
ipcMain.handle('snapshot-export-dialog', async (event, defaultFilename, content) => {
    try {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Export Workspace Snapshot',
            defaultPath: `${defaultFilename}${SNAPSHOT_EXTENSION}`,
            filters: [
                { name: 'Seran Snapshot', extensions: ['Seran-snapshot'] },
                { name: 'JSON', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        if (result.canceled || !result.filePath) {
            return { success: false, canceled: true };
        }
        
        await fs.writeFile(result.filePath, content, 'utf8');
        console.log(`[Snapshot] Exported to: ${result.filePath}`);
        return { success: true, filePath: result.filePath };
    } catch (error) {
        console.error('[Snapshot] Export error:', error);
        return { success: false, error: error.message };
    }
});

// Import snapshot with file dialog
ipcMain.handle('snapshot-import-dialog', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Import Workspace Snapshot',
            filters: [
                { name: 'Seran Snapshot', extensions: ['Seran-snapshot'] },
                { name: 'JSON', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['openFile']
        });
        
        if (result.canceled || result.filePaths.length === 0) {
            return { success: false, canceled: true };
        }
        
        const filePath = result.filePaths[0];
        const content = await fs.readFile(filePath, 'utf8');
        console.log(`[Snapshot] Imported from: ${filePath}`);
        return { success: true, filePath, content };
    } catch (error) {
        console.error('[Snapshot] Import error:', error);
        return { success: false, error: error.message };
    }
});

// Get snapshots directory path
ipcMain.handle('snapshot-get-dir', async () => {
    return await ensureSnapshotsDir();
});

// Open snapshots folder in file explorer
ipcMain.handle('snapshot-open-folder', async () => {
    const dir = await ensureSnapshotsDir();
    shell.openPath(dir);
    return { success: true };
});

// ============================================================================
// Offline Pages File Operations
// ============================================================================

const { net } = require('electron');

// Get the offline pages directory path
function getOfflineDir() {
    return path.join(app.getPath('userData'), 'offline-pages');
}

// Get the offline images directory path
function getOfflineImagesDir() {
    return path.join(getOfflineDir(), 'images');
}

// Ensure offline directories exist
async function ensureOfflineDirs() {
    const offlineDir = getOfflineDir();
    const imagesDir = getOfflineImagesDir();
    try {
        await fs.mkdir(offlineDir, { recursive: true });
        await fs.mkdir(imagesDir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
    return { offlineDir, imagesDir };
}

// Fetch a page's HTML content
ipcMain.handle('offline-fetch-page', async (event, url) => {
    try {
        console.log(`[Offline] Fetching: ${url}`);
        
        return new Promise((resolve) => {
            const request = net.request({
                url,
                method: 'GET',
            });
            
            request.setHeader('User-Agent', userAgent);
            request.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
            
            let data = '';
            let responseHeaders = {};
            
            request.on('response', (response) => {
                responseHeaders = response.headers;
                response.on('data', (chunk) => {
                    data += chunk.toString();
                });
                response.on('end', () => {
                    console.log(`[Offline] Fetched ${data.length} bytes from ${url}`);
                    resolve({ 
                        success: true, 
                        html: data, 
                        contentType: responseHeaders['content-type']?.[0] || 'text/html',
                        url 
                    });
                });
            });
            
            request.on('error', (error) => {
                console.error(`[Offline] Fetch error for ${url}:`, error);
                resolve({ success: false, error: error.message });
            });
            
            request.end();
        });
    } catch (error) {
        console.error('[Offline] Fetch error:', error);
        return { success: false, error: error.message };
    }
});

// Fetch and save an image
ipcMain.handle('offline-fetch-image', async (event, imageUrl, pageId) => {
    try {
        const { imagesDir } = await ensureOfflineDirs();
        
        return new Promise((resolve) => {
            const request = net.request({
                url: imageUrl,
                method: 'GET',
            });
            
            request.setHeader('User-Agent', userAgent);
            
            const chunks = [];
            
            request.on('response', (response) => {
                const contentType = response.headers['content-type']?.[0] || 'image/jpeg';
                const extension = contentType.includes('png') ? '.png' 
                    : contentType.includes('gif') ? '.gif'
                    : contentType.includes('webp') ? '.webp'
                    : contentType.includes('svg') ? '.svg'
                    : '.jpg';
                
                response.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                
                response.on('end', async () => {
                    try {
                        const buffer = Buffer.concat(chunks);
                        const imageId = `${pageId}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
                        const filename = `${imageId}${extension}`;
                        const filePath = path.join(imagesDir, filename);
                        
                        await fs.writeFile(filePath, buffer);
                        
                        console.log(`[Offline] Saved image: ${filename} (${buffer.length} bytes)`);
                        resolve({ 
                            success: true, 
                            localPath: filePath,
                            filename,
                            size: buffer.length,
                            originalUrl: imageUrl
                        });
                    } catch (err) {
                        resolve({ success: false, error: err.message });
                    }
                });
            });
            
            request.on('error', (error) => {
                console.error(`[Offline] Image fetch error:`, error);
                resolve({ success: false, error: error.message });
            });
            
            request.end();
        });
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Save offline page content to file
ipcMain.handle('offline-save-page', async (event, pageId, content) => {
    try {
        const { offlineDir } = await ensureOfflineDirs();
        const filePath = path.join(offlineDir, `${pageId}.html`);
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`[Offline] Saved page: ${pageId}`);
        return { success: true, filePath };
    } catch (error) {
        console.error('[Offline] Save error:', error);
        return { success: false, error: error.message };
    }
});

// Load offline page content from file
ipcMain.handle('offline-load-page', async (event, pageId) => {
    try {
        const { offlineDir } = await ensureOfflineDirs();
        const filePath = path.join(offlineDir, `${pageId}.html`);
        const content = await fs.readFile(filePath, 'utf8');
        return { success: true, content };
    } catch (error) {
        // Return null if file doesn't exist (page might be in localStorage only)
        if (error.code === 'ENOENT') {
            return { success: false, notFound: true };
        }
        return { success: false, error: error.message };
    }
});

// Delete offline page files
ipcMain.handle('offline-delete-page', async (event, pageId) => {
    try {
        const { offlineDir, imagesDir } = await ensureOfflineDirs();
        
        // Delete HTML file
        const htmlPath = path.join(offlineDir, `${pageId}.html`);
        try {
            await fs.unlink(htmlPath);
        } catch (e) {
            if (e.code !== 'ENOENT') throw e;
        }
        
        // Delete associated images
        const imageFiles = await fs.readdir(imagesDir);
        for (const file of imageFiles) {
            if (file.startsWith(pageId)) {
                await fs.unlink(path.join(imagesDir, file));
            }
        }
        
        console.log(`[Offline] Deleted page and images: ${pageId}`);
        return { success: true };
    } catch (error) {
        console.error('[Offline] Delete error:', error);
        return { success: false, error: error.message };
    }
});

// Get offline storage stats
ipcMain.handle('offline-get-stats', async () => {
    try {
        const { offlineDir, imagesDir } = await ensureOfflineDirs();
        
        let totalSize = 0;
        let pageCount = 0;
        let imageCount = 0;
        
        // Count pages
        const pageFiles = await fs.readdir(offlineDir);
        for (const file of pageFiles) {
            if (file.endsWith('.html')) {
                pageCount++;
                const stats = await fs.stat(path.join(offlineDir, file));
                totalSize += stats.size;
            }
        }
        
        // Count images
        const imageFiles = await fs.readdir(imagesDir);
        for (const file of imageFiles) {
            imageCount++;
            const stats = await fs.stat(path.join(imagesDir, file));
            totalSize += stats.size;
        }
        
        return {
            success: true,
            pageCount,
            imageCount,
            totalSize,
            offlineDir,
            imagesDir
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Open offline folder in file explorer
ipcMain.handle('offline-open-folder', async () => {
    const { offlineDir } = await ensureOfflineDirs();
    shell.openPath(offlineDir);
    return { success: true };
});

// Get image as data URL for display
ipcMain.handle('offline-get-image-data', async (event, filePath) => {
    try {
        const buffer = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
        };
        const mimeType = mimeTypes[ext] || 'image/jpeg';
        const base64 = buffer.toString('base64');
        return { success: true, dataUrl: `data:${mimeType};base64,${base64}` };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// ============================================================================
// Password Manager Secure Storage
// ============================================================================

const crypto = require('crypto');

// Get the passwords directory path
function getPasswordsDir() {
    return path.join(app.getPath('userData'), 'passwords');
}

// Ensure passwords directory exists
async function ensurePasswordsDir() {
    const dir = getPasswordsDir();
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
    return dir;
}

// Get the vault file path
function getVaultPath() {
    return path.join(getPasswordsDir(), 'vault.enc');
}

// Get the vault settings file path
function getVaultSettingsPath() {
    return path.join(getPasswordsDir(), 'vault-settings.json');
}

// Save encrypted vault data
ipcMain.handle('password-save-vault', async (event, encryptedData) => {
    try {
        await ensurePasswordsDir();
        const vaultPath = getVaultPath();
        await fs.writeFile(vaultPath, encryptedData, 'utf8');
        console.log('[Password] Vault saved');
        return { success: true };
    } catch (error) {
        console.error('[Password] Save vault error:', error);
        return { success: false, error: error.message };
    }
});

// Load encrypted vault data
ipcMain.handle('password-load-vault', async () => {
    try {
        await ensurePasswordsDir();
        const vaultPath = getVaultPath();
        const data = await fs.readFile(vaultPath, 'utf8');
        return { success: true, data };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { success: false, notFound: true };
        }
        console.error('[Password] Load vault error:', error);
        return { success: false, error: error.message };
    }
});

// Save vault settings (salt, verification hash, etc.)
ipcMain.handle('password-save-settings', async (event, settings) => {
    try {
        await ensurePasswordsDir();
        const settingsPath = getVaultSettingsPath();
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
        console.log('[Password] Vault settings saved');
        return { success: true };
    } catch (error) {
        console.error('[Password] Save settings error:', error);
        return { success: false, error: error.message };
    }
});

// Load vault settings
ipcMain.handle('password-load-settings', async () => {
    try {
        await ensurePasswordsDir();
        const settingsPath = getVaultSettingsPath();
        const data = await fs.readFile(settingsPath, 'utf8');
        return { success: true, settings: JSON.parse(data) };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { success: false, notFound: true };
        }
        console.error('[Password] Load settings error:', error);
        return { success: false, error: error.message };
    }
});

// Delete vault completely
ipcMain.handle('password-delete-vault', async () => {
    try {
        const dir = await ensurePasswordsDir();
        const vaultPath = getVaultPath();
        const settingsPath = getVaultSettingsPath();
        
        try { await fs.unlink(vaultPath); } catch (e) { if (e.code !== 'ENOENT') throw e; }
        try { await fs.unlink(settingsPath); } catch (e) { if (e.code !== 'ENOENT') throw e; }
        
        console.log('[Password] Vault deleted');
        return { success: true };
    } catch (error) {
        console.error('[Password] Delete vault error:', error);
        return { success: false, error: error.message };
    }
});

// Check if vault exists
ipcMain.handle('password-vault-exists', async () => {
    try {
        const settingsPath = getVaultSettingsPath();
        await fs.access(settingsPath);
        return { exists: true };
    } catch (error) {
        return { exists: false };
    }
});

// Generate secure random bytes (for IV/salt)
ipcMain.handle('password-generate-random', (event, length) => {
    return crypto.randomBytes(length).toString('base64');
});

// Export passwords (encrypted) to file
ipcMain.handle('password-export', async (event, encryptedData, defaultFilename) => {
    try {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Export Passwords',
            defaultPath: `${defaultFilename || 'passwords-export'}.Seran-passwords`,
            filters: [
                { name: 'Seran Passwords', extensions: ['Seran-passwords'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        if (result.canceled || !result.filePath) {
            return { success: false, canceled: true };
        }
        
        await fs.writeFile(result.filePath, encryptedData, 'utf8');
        console.log(`[Password] Exported to: ${result.filePath}`);
        return { success: true, filePath: result.filePath };
    } catch (error) {
        console.error('[Password] Export error:', error);
        return { success: false, error: error.message };
    }
});

// Import passwords from file
ipcMain.handle('password-import', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Import Passwords',
            filters: [
                { name: 'Seran Passwords', extensions: ['Seran-passwords'] },
                { name: 'CSV', extensions: ['csv'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['openFile']
        });
        
        if (result.canceled || result.filePaths.length === 0) {
            return { success: false, canceled: true };
        }
        
        const filePath = result.filePaths[0];
        const content = await fs.readFile(filePath, 'utf8');
        console.log(`[Password] Imported from: ${filePath}`);
        return { success: true, filePath, content };
    } catch (error) {
        console.error('[Password] Import error:', error);
        return { success: false, error: error.message };
    }
});

// ============================================================================
// Proxy/VPN Support
// ============================================================================

// Current proxy configuration
let currentProxyConfig = null;

// Connect to proxy
ipcMain.handle('proxy-connect', async (event, proxyRules, bypassRules = '') => {
    try {
        const ses = session.defaultSession;
        
        await ses.setProxy({
            proxyRules: proxyRules,
            proxyBypassRules: bypassRules || '<local>'
        });
        
        currentProxyConfig = { proxyRules, bypassRules };
        console.log(`[Proxy] Connected: ${proxyRules}`);
        
        return { success: true };
    } catch (error) {
        console.error('[Proxy] Connect error:', error);
        return { success: false, error: error.message };
    }
});

// Disconnect from proxy
ipcMain.handle('proxy-disconnect', async () => {
    try {
        const ses = session.defaultSession;
        
        await ses.setProxy({
            proxyRules: '',
            proxyBypassRules: ''
        });
        
        currentProxyConfig = null;
        console.log('[Proxy] Disconnected');
        
        return { success: true };
    } catch (error) {
        console.error('[Proxy] Disconnect error:', error);
        return { success: false, error: error.message };
    }
});

// Test proxy connection
ipcMain.handle('proxy-test', async (event, proxyRules) => {
    try {
        const startTime = Date.now();
        
        // Create a temporary session to test the proxy
        const testSession = session.fromPartition('proxy-test-' + Date.now());
        await testSession.setProxy({ proxyRules });
        
        // Try to fetch a test URL
        return new Promise((resolve) => {
            const request = net.request({
                url: 'https://www.google.com/generate_204',
                session: testSession
            });
            
            request.on('response', (response) => {
                const latency = Date.now() - startTime;
                resolve({ success: true, latency, statusCode: response.statusCode });
            });
            
            request.on('error', (error) => {
                resolve({ success: false, error: error.message });
            });
            
            // Timeout after 10 seconds
            setTimeout(() => {
                request.abort();
                resolve({ success: false, error: 'Connection timeout' });
            }, 10000);
            
            request.end();
        });
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get current proxy status
ipcMain.handle('proxy-get-status', () => {
    return {
        isConnected: currentProxyConfig !== null,
        config: currentProxyConfig
    };
});

// ============================================================================
// Screenshot Capture
// ============================================================================

// Capture visible area
ipcMain.handle('screenshot-capture-visible', async (event, options = {}) => {
    try {
        if (!mainWindow) {
            return { success: false, error: 'No window available' };
        }
        
        const image = await mainWindow.webContents.capturePage();
        const dataUrl = image.toDataURL();
        const size = image.getSize();
        
        return {
            success: true,
            dataUrl,
            width: size.width,
            height: size.height
        };
    } catch (error) {
        console.error('[Screenshot] Capture error:', error);
        return { success: false, error: error.message };
    }
});

// Capture specific rect
ipcMain.handle('screenshot-capture-rect', async (event, rect, options = {}) => {
    try {
        if (!mainWindow) {
            return { success: false, error: 'No window available' };
        }
        
        const image = await mainWindow.webContents.capturePage(rect);
        const dataUrl = image.toDataURL();
        const size = image.getSize();
        
        return {
            success: true,
            dataUrl,
            width: size.width,
            height: size.height
        };
    } catch (error) {
        console.error('[Screenshot] Capture rect error:', error);
        return { success: false, error: error.message };
    }
});

// Save screenshot with dialog
ipcMain.handle('screenshot-save-dialog', async (event, dataUrl, defaultFilename) => {
    try {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Screenshot',
            defaultPath: `${defaultFilename || 'screenshot'}.png`,
            filters: [
                { name: 'PNG Image', extensions: ['png'] },
                { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
                { name: 'WebP Image', extensions: ['webp'] }
            ]
        });
        
        if (result.canceled || !result.filePath) {
            return { success: false, canceled: true };
        }
        
        // Convert data URL to buffer
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        await fs.writeFile(result.filePath, buffer);
        console.log(`[Screenshot] Saved to: ${result.filePath}`);
        
        return { success: true, filePath: result.filePath };
    } catch (error) {
        console.error('[Screenshot] Save error:', error);
        return { success: false, error: error.message };
    }
});

// ============================================================================
// Session Restore
// ============================================================================

// Get session storage directory
function getSessionDir() {
    return path.join(app.getPath('userData'), 'sessions');
}

// Ensure session directory exists
async function ensureSessionDir() {
    const dir = getSessionDir();
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
    return dir;
}

// Get current session file path
function getSessionPath() {
    return path.join(getSessionDir(), 'current-session.json');
}

// Save session to file
ipcMain.handle('session-save', async (event, sessionData) => {
    try {
        await ensureSessionDir();
        const sessionPath = getSessionPath();
        await fs.writeFile(sessionPath, sessionData, 'utf8');
        console.log('[Session] Saved');
        return { success: true };
    } catch (error) {
        console.error('[Session] Save error:', error);
        return { success: false, error: error.message };
    }
});

// Load session from file
ipcMain.handle('session-load', async () => {
    try {
        await ensureSessionDir();
        const sessionPath = getSessionPath();
        const data = await fs.readFile(sessionPath, 'utf8');
        return { success: true, data };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { success: false, notFound: true };
        }
        console.error('[Session] Load error:', error);
        return { success: false, error: error.message };
    }
});

// Clear session file
ipcMain.handle('session-clear', async () => {
    try {
        const sessionPath = getSessionPath();
        await fs.unlink(sessionPath);
        console.log('[Session] Cleared');
        return { success: true };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { success: true }; // Already cleared
        }
        console.error('[Session] Clear error:', error);
        return { success: false, error: error.message };
    }
});

// ============================================================================
// Tab Detachment - New Window Creation
// ============================================================================

// Store for child windows
const childWindows = new Map();

// Create a new window with a specific tab
ipcMain.handle('window-create-with-tab', async (event, tabData) => {
    try {
        const newWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 600,
            minHeight: 400,
            frame: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
                webviewTag: true,
                sandbox: false,
                webSecurity: true,
            },
            backgroundColor: '#000000',
            titleBarStyle: 'hiddenInset',
            show: false,
        });
        
        const windowId = newWindow.id;
        childWindows.set(windowId, newWindow);
        
        newWindow.once('ready-to-show', () => {
            newWindow.show();
            // Send the tab data to the new window
            newWindow.webContents.send('init-with-tab', tabData);
        });
        
        if (isDev) {
            newWindow.loadURL('http://localhost:5173');
        } else {
            newWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        }
        
        newWindow.on('closed', () => {
            childWindows.delete(windowId);
        });
        
        console.log(`[Window] Created new window ${windowId} with tab: ${tabData.url}`);
        return { success: true, windowId };
    } catch (error) {
        console.error('[Window] Create error:', error);
        return { success: false, error: error.message };
    }
});

// Get current window position
ipcMain.handle('window-get-bounds', () => {
    if (mainWindow) {
        return mainWindow.getBounds();
    }
    return null;
});

// Set window bounds
ipcMain.handle('window-set-bounds', (event, bounds) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.setBounds(bounds);
        return { success: true };
    }
    return { success: false };
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
