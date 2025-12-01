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
            'container-remove-cookie'
        ];
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
    }
});
