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
    
    // Container session management
    getContainerSession: (containerId) => ipcRenderer.invoke('get-container-session', containerId),
    clearContainerSession: (containerId) => ipcRenderer.invoke('clear-container-session', containerId),
    
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
    invoke: (channel, data) => {
        const validChannels = [
            'window-minimize', 
            'window-maximize', 
            'window-close', 
            'window-is-maximized',
            'navigate-to',
            'get-page-info',
            'download-url',
            'get-container-session',
            'clear-container-session'
        ];
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, data);
        }
    }
});
