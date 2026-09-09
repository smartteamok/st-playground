const path = require('path');
const fs = require('fs');
const {pathToFileURL} = require('url');
const {net, protocol} = require('electron');

const APP_SCHEME = 'app';
const APP_HOST = 'editor';

const registerAppScheme = () => {
    protocol.registerSchemesAsPrivileged([{
        scheme: APP_SCHEME,
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            stream: true,
            corsEnabled: true
        }
    }]);
};

const editorUrl = (pathname = 'index.html', search = '') => {
    const url = new URL(`${APP_SCHEME}://${APP_HOST}/${pathname.replace(/^\//, '')}`);
    if (search) url.search = search.startsWith('?') ? search : `?${search}`;
    return url.toString();
};

const isInside = (root, target) => {
    const relative = path.relative(path.resolve(root), path.resolve(target));
    return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const unpackAsarPath = candidate => candidate.replace(
    `${path.sep}app.asar${path.sep}`,
    `${path.sep}app.asar.unpacked${path.sep}`
);

const resolveRendererRoot = () => {
    const inside = path.join(__dirname, '../renderer');
    const unpacked = unpackAsarPath(inside);
    if (unpacked !== inside && fs.existsSync(unpacked)) return unpacked;
    return inside;
};

const resolveLibraryRoot = () => {
    const extra = path.join(process.resourcesPath, 'library-assets');
    if (fs.existsSync(extra)) return extra;
    return path.join(resolveRendererRoot(), 'static/library-assets');
};

const resolveActividadesRoot = () => {
    const extra = path.join(process.resourcesPath, 'actividades');
    if (fs.existsSync(path.join(extra, 'catalogo.json'))) return extra;
    return path.join(resolveRendererRoot(), 'actividades');
};

const resolveAppPath = requestUrl => {
    const {hostname, pathname} = new URL(requestUrl);
    if (hostname !== APP_HOST) return null;

    let decoded = decodeURIComponent(pathname);
    if (decoded.startsWith('/')) decoded = decoded.slice(1);
    if (!decoded || decoded.endsWith('/')) decoded = `${decoded}index.html`;

    const rendererRoot = resolveRendererRoot();
    const libraryRoot = resolveLibraryRoot();
    const actividadesRoot = resolveActividadesRoot();
    const libraryPrefix = 'static/library-assets/';
    const actividadesPrefix = 'actividades/';

    if (decoded.startsWith(libraryPrefix)) {
        const rest = decoded.slice(libraryPrefix.length);
        const target = path.join(libraryRoot, rest);
        return isInside(libraryRoot, target) ? target : null;
    }

    if (decoded.startsWith(actividadesPrefix)) {
        const rest = decoded.slice(actividadesPrefix.length);
        const target = path.join(actividadesRoot, rest);
        return isInside(actividadesRoot, target) ? target : null;
    }

    const target = path.join(rendererRoot, decoded);
    return isInside(rendererRoot, target) ? target : null;
};

const attachAppProtocolHandler = () => {
    protocol.handle(APP_SCHEME, request => {
        const target = resolveAppPath(request.url);
        if (!target) {
            return new Response('forbidden', {status: 403});
        }
        if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
            return new Response('not found', {status: 404});
        }
        return net.fetch(pathToFileURL(target).toString());
    });
};

module.exports = {
    APP_HOST,
    APP_SCHEME,
    attachAppProtocolHandler,
    editorUrl,
    registerAppScheme,
    resolveActividadesRoot,
    resolveLibraryRoot,
    resolveRendererRoot
};
