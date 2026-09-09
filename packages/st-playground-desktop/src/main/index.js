const fs = require('fs');
const path = require('path');
const {app, BrowserWindow, Menu, dialog, ipcMain, session, shell} = require('electron');

const {projectPathFromArgv, actividadIdFromArgv} = require('./argv');
const {
    attachAppProtocolHandler,
    editorUrl,
    registerAppScheme
} = require('./app-protocol');
const {attachWillDownloadHandler} = require('./save-project');

registerAppScheme();

const packageJson = require('../../package.json');

const isDevServer = process.env.ST_PLAYGROUND_DEV === '1';
const DEV_URL = process.env.ST_PLAYGROUND_DEV_URL || 'http://127.0.0.1:8611/';
const DEFAULT_SIZE = {width: 1280, height: 800};
const ALLOWED_EXTERNAL_PROTOCOLS = ['http:', 'https:', 'mailto:'];
const MICROBIT = {vendorId: 0x0d28, productId: 0x0204};

const windows = {};
let queuedProjectPath = projectPathFromArgv(process.argv);
let queuedActividadId = queuedProjectPath ? null : actividadIdFromArgv(process.argv);

app.commandLine.appendSwitch('host-resolver-rules', 'MAP device-manager.scratch.mit.edu 127.0.0.1');
app.commandLine.appendSwitch('enable-unsafe-swiftshader');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
if (process.env.ST_PLAYGROUND_SWIFTSHADER === '1') {
    app.commandLine.appendSwitch('use-gl', 'angle');
    app.commandLine.appendSwitch('use-angle', 'swiftshader');
}
if (process.env.ST_PLAYGROUND_NO_SANDBOX === '1') {
    app.commandLine.appendSwitch('no-sandbox');
}

if (process.env.ST_PLAYGROUND_ALLOW_MULTI !== '1') {
    const gotLock = app.requestSingleInstanceLock();
    if (!gotLock) {
        app.quit();
    }
}

const editorBase = () => (isDevServer ? DEV_URL : editorUrl());

const makeWindowUrl = (fileName = 'index.html', search = '') => {
    if (isDevServer) {
        const url = new URL(fileName, DEV_URL);
        if (search) url.search = search.startsWith('?') ? search : `?${search}`;
        return url.toString();
    }
    return editorUrl(fileName, search);
};

const readProjectFile = async filePath => {
    try {
        const data = await fs.promises.readFile(filePath);
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    } catch (error) {
        const parent = windows.main || null;
        await dialog.showMessageBox(parent, {
            type: 'error',
            title: 'No se pudo abrir el proyecto',
            message: `No se pudo leer el archivo:\n${filePath}`,
            detail: error.message
        });
        return null;
    }
};

let initialProjectDataPromise = queuedProjectPath ?
    readProjectFile(queuedProjectPath) :
    Promise.resolve(null);

const sendProjectToRenderer = async filePath => {
    const data = await readProjectFile(filePath);
    if (!data || !windows.main) return;
    windows.main.webContents.send('open-project-data', data);
};

const sendActividadToRenderer = id => {
    if (!id || !windows.main) return;
    windows.main.webContents.send('open-actividad', id);
};

const handleIncomingArgv = argv => {
    const filePath = projectPathFromArgv(argv);
    const actividadId = actividadIdFromArgv(argv);
    if (windows.main) {
        if (windows.main.isMinimized()) windows.main.restore();
        windows.main.focus();
        if (filePath) {
            sendProjectToRenderer(filePath);
            return;
        }
        if (actividadId) sendActividadToRenderer(actividadId);
        return;
    }
    if (filePath) {
        queuedProjectPath = filePath;
        queuedActividadId = null;
        initialProjectDataPromise = readProjectFile(filePath);
        return;
    }
    if (actividadId) {
        queuedActividadId = actividadId;
    }
};

const handlePermissionRequest = async (webContents, permission, callback, details) => {
    if (!windows.main || webContents !== windows.main.webContents) {
        return callback(false);
    }
    if (!details.isMainFrame || permission !== 'media') {
        return callback(false);
    }
    const requiredBase = editorBase();
    if (!details.requestingUrl.startsWith(requiredBase)) {
        return callback(false);
    }
    return callback(true);
};

const attachUsbPicker = webContents => {
    webContents.session.on('select-usb-device', (event, details, callback) => {
        event.preventDefault();
        const match = details.deviceList.find(device =>
            device.vendorId === MICROBIT.vendorId && device.productId === MICROBIT.productId
        );
        callback(match ? match.deviceId : '');
    });
};

const attachNavigationGuards = webContents => {
    webContents.setWindowOpenHandler(({url}) => {
        let protocolName = '';
        try {
            protocolName = new URL(url).protocol;
        } catch {
            protocolName = '';
        }
        if (ALLOWED_EXTERNAL_PROTOCOLS.includes(protocolName)) {
            shell.openExternal(url).catch(() => {});
        }
        return {action: 'deny'};
    });

    webContents.on('will-navigate', event => {
        const allowed = event.url.startsWith(editorBase()) ||
            event.url.startsWith('app://') ||
            (isDevServer && event.url.startsWith(DEV_URL));
        if (!allowed) event.preventDefault();
    });
};

const confirmLeave = window => {
    const forced = process.env.ST_PLAYGROUND_CONFIRM_LEAVE;
    if (forced === 'leave') return true;
    if (forced === 'stay') return false;
    const choice = dialog.showMessageBoxSync(window, {
        title: packageJson.productName,
        type: 'question',
        message: '¿Salir de ST-Playground?',
        detail: 'Los cambios que no hayas guardado se van a perder.',
        buttons: ['Seguir editando', 'Salir'],
        cancelId: 0,
        defaultId: 0
    });
    return choice === 1;
};

const createWindow = ({url, search, ...browserWindowOptions}) => {
    const preloadPath = path.join(__dirname, '../preload/preload.js');
    const window = new BrowserWindow({
        useContentSize: true,
        show: false,
        backgroundColor: '#16324F',
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            devTools: !app.isPackaged
        },
        ...browserWindowOptions
    });

    window.webContents.session.setPermissionRequestHandler(handlePermissionRequest);
    attachNavigationGuards(window.webContents);
    window.loadURL(makeWindowUrl(url, search));
    return window;
};

const createAboutWindow = () => {
    const versions = `version=${encodeURIComponent(packageJson.version)}` +
        `&electron=${encodeURIComponent(process.versions.electron)}` +
        `&chrome=${encodeURIComponent(process.versions.chrome)}`;
    const window = createWindow({
        url: 'about.html',
        search: versions,
        width: 520,
        height: 640,
        parent: windows.main,
        autoHideMenuBar: true,
        title: `Acerca de ${packageJson.productName}`
    });
    window.setMenu(null);
    return window;
};

const createMainWindow = () => {
    const search = (!queuedProjectPath && queuedActividadId) ?
        `actividad=${encodeURIComponent(queuedActividadId)}` : '';
    const window = createWindow({
        url: 'index.html',
        search,
        width: DEFAULT_SIZE.width,
        height: DEFAULT_SIZE.height,
        title: `${packageJson.productName} ${packageJson.version}`
    });

    attachWillDownloadHandler(window, window.webContents);
    attachUsbPicker(window.webContents);

    window.webContents.on('will-prevent-unload', event => {
        if (confirmLeave(window)) {
            event.preventDefault();
        }
    });

    window.once('ready-to-show', () => {
        window.show();
    });

    return window;
};

if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null);
}

app.on('window-all-closed', () => {
    app.quit();
});

app.on('second-instance', (_event, argv) => {
    handleIncomingArgv(argv);
});

app.on('open-url', (event, url) => {
    event.preventDefault();
    handleIncomingArgv([url]);
});

app.whenReady().then(() => {
    if (app.isPackaged) {
        app.setAsDefaultProtocolClient('st-playground');
    }
    if (!isDevServer) {
        attachAppProtocolHandler();
    }

    session.defaultSession.setPermissionCheckHandler((_webContents, permission) => permission === 'media');

    windows.main = createMainWindow();
    windows.main.on('closed', () => {
        delete windows.main;
        if (windows.about && !windows.about.isDestroyed()) {
            windows.about.destroy();
            delete windows.about;
        }
    });
});

ipcMain.handle('get-initial-project-data', () => initialProjectDataPromise);

ipcMain.handle('show-load-error', async (_event, detail) => {
    const parent = windows.main || null;
    await dialog.showMessageBox(parent, {
        type: 'error',
        title: 'No se pudo abrir el proyecto',
        message: 'El archivo está dañado o no es un proyecto válido.',
        detail: String(detail || '')
    });
});

ipcMain.on('open-about-window', () => {
    if (windows.about && !windows.about.isDestroyed()) {
        windows.about.show();
        windows.about.focus();
        return;
    }
    windows.about = createAboutWindow();
    windows.about.on('close', event => {
        if (windows.main) {
            event.preventDefault();
            windows.about.hide();
        }
    });
    windows.about.once('ready-to-show', () => {
        windows.about.show();
    });
});
