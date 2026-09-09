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

module.exports = {
    isBundledApp,
    isElectronApp,
    projectPathFromArgv
};
