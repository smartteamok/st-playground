const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('desktop', {
    getInitialProjectData: () => ipcRenderer.invoke('get-initial-project-data'),
    onSetTitleFromSave: callback => {
        ipcRenderer.on('setTitleFromSave', (_event, args) => callback(args));
    },
    onOpenProject: callback => {
        ipcRenderer.on('open-project-data', (_event, data) => callback(data));
    },
    openAbout: () => ipcRenderer.send('open-about-window'),
    showLoadError: detail => ipcRenderer.invoke('show-load-error', detail)
});
