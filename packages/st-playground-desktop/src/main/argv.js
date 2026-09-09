const isElectronApp = () => Boolean(process.versions.electron);
const isBundledApp = () => isElectronApp() && !process.defaultApp;

const projectPathFromArgv = argv => {
    const skip = isBundledApp() ? 1 : 2;
    const candidates = argv.slice(skip).filter(argument => (
        typeof argument === 'string' &&
        !argument.startsWith('-') &&
        /\.sb3$/i.test(argument)
    ));
    return candidates.length ? candidates[candidates.length - 1] : null;
};

const actividadIdFromProtocol = url => {
    if (typeof url !== 'string' || !url.startsWith('st-playground:')) return null;
    try {
        const parsed = new URL(url);
        const parts = `${parsed.hostname || ''}${parsed.pathname || ''}`
            .split('/')
            .filter(Boolean);
        if (parts[0] === 'actividad' && parts[1]) {
            return decodeURIComponent(parts[1]);
        }
        return null;
    } catch {
        return null;
    }
};

const actividadIdFromArgv = argv => {
    for (const argument of argv) {
        const id = actividadIdFromProtocol(argument);
        if (id) return id;
    }
    return null;
};

module.exports = {
    actividadIdFromArgv,
    actividadIdFromProtocol,
    isBundledApp,
    isElectronApp,
    projectPathFromArgv
};
