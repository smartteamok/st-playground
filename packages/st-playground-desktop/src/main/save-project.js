const fs = require('fs');
const path = require('path');
const {app, dialog} = require('electron');

const {getFilterForExtension} = require('./file-filters');

const PROJECT_MIME = 'application/x.scratch.sb3';

const isProjectSave = downloadItem => downloadItem.getMimeType() === PROJECT_MIME;

const moveFile = async (fromPath, toPath) => {
    try {
        await fs.promises.rename(fromPath, toPath);
    } catch (error) {
        if (error.code !== 'EXDEV') throw error;
        await fs.promises.copyFile(fromPath, toPath);
        await fs.promises.unlink(fromPath);
    }
};

const chooseSavePath = (window, downloadItem) => {
    const forced = process.env.ST_PLAYGROUND_SAVE_PATH;
    if (forced) return forced;

    const itemPath = downloadItem.getFilename();
    const baseName = path.basename(itemPath);
    const extName = path.extname(baseName);
    const options = {defaultPath: baseName};
    if (extName) {
        options.filters = [getFilterForExtension(extName.replace(/^\./, ''))];
    }
    return dialog.showSaveDialogSync(window, options) || null;
};

const attachWillDownloadHandler = (window, webContents) => {
    webContents.session.on('will-download', (event, downloadItem) => {
        const projectSave = isProjectSave(downloadItem);
        const userChosenPath = chooseSavePath(window, downloadItem);
        if (!userChosenPath) {
            downloadItem.cancel();
            return;
        }

        const tempPath = path.join(app.getPath('temp'), `st-playground-${Date.now()}-${path.basename(userChosenPath)}`);
        downloadItem.setSavePath(tempPath);

        downloadItem.on('done', async (doneEvent, doneState) => {
            try {
                if (doneState !== 'completed') {
                    throw new Error(`save ${doneState}`);
                }
                await fs.promises.mkdir(path.dirname(userChosenPath), {recursive: true});
                await moveFile(tempPath, userChosenPath);
                if (projectSave) {
                    const extName = path.extname(userChosenPath);
                    const title = path.basename(userChosenPath, extName);
                    webContents.send('setTitleFromSave', {title, filePath: userChosenPath});
                    window.setTitle(`ST-Playground — ${title}`);
                }
            } catch (error) {
                await dialog.showMessageBox(window, {
                    type: 'error',
                    title: 'No se pudo guardar el proyecto',
                    message: `Falló el guardado:\n${userChosenPath}`,
                    detail: error.message
                });
                fs.promises.unlink(tempPath).catch(() => {});
            }
        });
    });
};

module.exports = {
    attachWillDownloadHandler,
    isProjectSave
};
