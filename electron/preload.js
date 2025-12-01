const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Window controls
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    
    // Platform info
    platform: process.platform,
    
    // Browser navigation
    navigateTo: (url) => ipcRenderer.invoke('navigate-to', url),
    getPageInfo: (webContentsId) => ipcRenderer.invoke('get-page-info', webContentsId),
    downloadUrl: (url) => ipcRenderer.invoke('download-url', url),
    
    // =========================================================================
    // Print & PDF
    // =========================================================================
    
    print: {
        /**
         * Print the current page
         * @param {Object} options - Print options
         */
        printPage: (options = {}) => ipcRenderer.invoke('print-page', options),
        
        /**
         * Save the current page as PDF
         * @param {Object} options - PDF options
         */
        savePDF: (options = {}) => ipcRenderer.invoke('save-pdf', options),
    },
    
    // =========================================================================
    // Developer Tools
    // =========================================================================
    
    devtools: {
        /**
         * Open DevTools for a webview (call this from renderer)
         */
        open: () => ipcRenderer.invoke('devtools-open'),
        
        /**
         * Toggle DevTools for the main browser window
         */
        toggleMain: () => ipcRenderer.invoke('devtools-toggle-main'),
    },
    
    // =========================================================================
    // Container Session Management
    // =========================================================================
    
    container: {
        /**
         * Get or create a session partition for a container
         * @param {string} containerId - Unique container identifier
         * @param {boolean} isDisposable - If true, session data is only in memory
         * @returns {Promise<string>} The partition string to use with webview
         */
        getPartition: (containerId, isDisposable = false) => 
            ipcRenderer.invoke('container-get-partition', containerId, isDisposable),
        
        /**
         * Clear all session data for a container (cookies, storage, cache)
         * @param {string} containerId - Container to clear
         */
        clear: (containerId) => 
            ipcRenderer.invoke('container-clear', containerId),
        
        /**
         * Destroy a disposable container completely
         * @param {string} containerId - Container to destroy
         */
        destroy: (containerId) => 
            ipcRenderer.invoke('container-destroy', containerId),
        
        /**
         * Get statistics for a container (cookie count, cache size)
         * @param {string} containerId - Container to query
         */
        getStats: (containerId) => 
            ipcRenderer.invoke('container-get-stats', containerId),
        
        /**
         * List all active container sessions
         */
        listActive: () => 
            ipcRenderer.invoke('container-list-active'),
        
        /**
         * Clear all disposable containers
         */
        clearAllDisposable: () => 
            ipcRenderer.invoke('container-clear-all-disposable'),
        
        /**
         * Get cookies for a container
         * @param {string} containerId - Container ID
         * @param {object} filter - Optional filter (url, name, domain, etc.)
         */
        getCookies: (containerId, filter = {}) => 
            ipcRenderer.invoke('container-get-cookies', containerId, filter),
        
        /**
         * Remove a specific cookie from a container
         * @param {string} containerId - Container ID
         * @param {string} url - URL associated with the cookie
         * @param {string} name - Cookie name
         */
        removeCookie: (containerId, url, name) => 
            ipcRenderer.invoke('container-remove-cookie', containerId, url, name),
    },
    
    // =========================================================================
    // Snapshot File Operations
    // =========================================================================
    
    snapshot: {
        /**
         * Save snapshot to the app's snapshot directory
         * @param {string} filename - Filename (without extension)
         * @param {string} content - Snapshot JSON content
         */
        saveToFile: (filename, content) =>
            ipcRenderer.invoke('snapshot-save-to-file', filename, content),
        
        /**
         * Load snapshot from a specific file path
         * @param {string} filePath - Full path to snapshot file
         */
        loadFromFile: (filePath) =>
            ipcRenderer.invoke('snapshot-load-from-file', filePath),
        
        /**
         * List all saved snapshot files
         */
        listFiles: () =>
            ipcRenderer.invoke('snapshot-list-files'),
        
        /**
         * Delete a snapshot file
         * @param {string} filePath - Full path to snapshot file
         */
        deleteFile: (filePath) =>
            ipcRenderer.invoke('snapshot-delete-file', filePath),
        
        /**
         * Export snapshot with save dialog
         * @param {string} defaultFilename - Default filename
         * @param {string} content - Snapshot JSON content
         */
        exportWithDialog: (defaultFilename, content) =>
            ipcRenderer.invoke('snapshot-export-dialog', defaultFilename, content),
        
        /**
         * Import snapshot with open dialog
         */
        importWithDialog: () =>
            ipcRenderer.invoke('snapshot-import-dialog'),
        
        /**
         * Get the snapshots directory path
         */
        getDir: () =>
            ipcRenderer.invoke('snapshot-get-dir'),
        
        /**
         * Open snapshots folder in file explorer
         */
        openFolder: () =>
            ipcRenderer.invoke('snapshot-open-folder'),
    },
    
    // =========================================================================
    // Offline Pages Operations
    // =========================================================================
    
    offline: {
        /**
         * Fetch a page's HTML content for offline saving
         * @param {string} url - URL to fetch
         */
        fetchPage: (url) =>
            ipcRenderer.invoke('offline-fetch-page', url),
        
        /**
         * Fetch and save an image
         * @param {string} imageUrl - Image URL to fetch
         * @param {string} pageId - Parent page ID
         */
        fetchImage: (imageUrl, pageId) =>
            ipcRenderer.invoke('offline-fetch-image', imageUrl, pageId),
        
        /**
         * Save offline page content to file
         * @param {string} pageId - Page ID
         * @param {string} content - HTML content
         */
        savePage: (pageId, content) =>
            ipcRenderer.invoke('offline-save-page', pageId, content),
        
        /**
         * Load offline page content from file
         * @param {string} pageId - Page ID
         */
        loadPage: (pageId) =>
            ipcRenderer.invoke('offline-load-page', pageId),
        
        /**
         * Delete offline page and associated files
         * @param {string} pageId - Page ID
         */
        deletePage: (pageId) =>
            ipcRenderer.invoke('offline-delete-page', pageId),
        
        /**
         * Get offline storage statistics
         */
        getStats: () =>
            ipcRenderer.invoke('offline-get-stats'),
        
        /**
         * Open offline folder in file explorer
         */
        openFolder: () =>
            ipcRenderer.invoke('offline-open-folder'),
        
        /**
         * Get image as data URL
         * @param {string} filePath - Path to image file
         */
        getImageData: (filePath) =>
            ipcRenderer.invoke('offline-get-image-data', filePath),
    },
    
    // =========================================================================
    // Password Manager Operations
    // =========================================================================
    
    passwords: {
        /**
         * Save encrypted vault data to secure storage
         * @param {string} encryptedData - Encrypted vault data
         */
        saveVault: (encryptedData) =>
            ipcRenderer.invoke('password-save-vault', encryptedData),
        
        /**
         * Load encrypted vault data from secure storage
         */
        loadVault: () =>
            ipcRenderer.invoke('password-load-vault'),
        
        /**
         * Save vault settings (salt, verification hash)
         * @param {object} settings - Vault settings
         */
        saveSettings: (settings) =>
            ipcRenderer.invoke('password-save-settings', settings),
        
        /**
         * Load vault settings
         */
        loadSettings: () =>
            ipcRenderer.invoke('password-load-settings'),
        
        /**
         * Delete vault completely
         */
        deleteVault: () =>
            ipcRenderer.invoke('password-delete-vault'),
        
        /**
         * Check if vault exists
         */
        vaultExists: () =>
            ipcRenderer.invoke('password-vault-exists'),
        
        /**
         * Generate secure random bytes
         * @param {number} length - Number of bytes
         */
        generateRandom: (length) =>
            ipcRenderer.invoke('password-generate-random', length),
        
        /**
         * Export passwords with save dialog
         * @param {string} encryptedData - Encrypted password data
         * @param {string} defaultFilename - Default filename
         */
        exportWithDialog: (encryptedData, defaultFilename) =>
            ipcRenderer.invoke('password-export', encryptedData, defaultFilename),
        
        /**
         * Import passwords with open dialog
         */
        importWithDialog: () =>
            ipcRenderer.invoke('password-import'),
    },
    
    // Legacy container methods (for backward compatibility)
    getContainerSession: (containerId) => 
        ipcRenderer.invoke('container-get-partition', containerId, false),
    clearContainerSession: (containerId) => 
        ipcRenderer.invoke('container-clear', containerId),
    
    // IPC communication
    send: (channel, data) => {
        const validChannels = ['toMain', 'new-tab-request'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        const validChannels = ['fromMain', 'new-tab-request'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    removeListener: (channel, func) => {
        const validChannels = ['fromMain', 'new-tab-request'];
        if (validChannels.includes(channel)) {
            ipcRenderer.removeListener(channel, func);
        }
    },
    invoke: (channel, ...args) => {
        const validChannels = [
            'window-minimize', 
            'window-maximize', 
            'window-close', 
            'window-is-maximized',
            'navigate-to',
            'get-page-info',
            'download-url',
            'container-get-partition',
            'container-clear',
            'container-destroy',
            'container-get-stats',
            'container-list-active',
            'container-clear-all-disposable',
            'container-get-cookies',
            'container-remove-cookie',
            'snapshot-save-to-file',
            'snapshot-load-from-file',
            'snapshot-list-files',
            'snapshot-delete-file',
            'snapshot-export-dialog',
            'snapshot-import-dialog',
            'snapshot-get-dir',
            'snapshot-open-folder',
            'offline-fetch-page',
            'offline-fetch-image',
            'offline-save-page',
            'offline-load-page',
            'offline-delete-page',
            'offline-get-stats',
            'offline-open-folder',
            'offline-get-image-data',
            'password-save-vault',
            'password-load-vault',
            'password-save-settings',
            'password-load-settings',
            'password-delete-vault',
            'password-vault-exists',
            'password-generate-random',
            'password-export',
            'password-import'
        ];
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
    }
});
