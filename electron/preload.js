const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Add any APIs you want to expose to the renderer here
    // Example:
    // send: (channel, data) => ipcRenderer.send(channel, data),
    // on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});
